import React, { useState, useMemo } from 'react';
import {
  Award, Trophy, Timer, Video, TrendingUp, Plus,
  CheckCircle2, Clock, AlertCircle, Trash2, Play,
  Filter, Sparkles, Flame, Calendar, ChevronDown,
  Upload, X, RefreshCw, ArrowDownRight, ArrowUpRight,
  ShieldCheck, FileVideo, Check
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { toShamsiDate } from '../../utils/date';

const STROKE_LABELS = {
  FREESTYLE: 'کرال سینه (آزاد)',
  BACKSTROKE: 'کرال پشت',
  BREASTSTROKE: 'شنای قورباغه',
  BUTTERFLY: 'شنای پروانه',
  MEDLEY: 'مختلط انفرادی',
};

const STROKE_COLORS = {
  FREESTYLE: {
    badge: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dot: 'bg-sky-500',
    stroke: '#0284c7',
    gradient: '#38bdf8',
  },
  BACKSTROKE: {
    badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    stroke: '#6366f1',
    gradient: '#818cf8',
  },
  BREASTSTROKE: {
    badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    stroke: '#059669',
    gradient: '#34d399',
  },
  BUTTERFLY: {
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    stroke: '#d97706',
    gradient: '#fbbf24',
  },
  MEDLEY: {
    badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
    stroke: '#9333ea',
    gradient: '#c084fc',
  },
};

const VIDEO_CATEGORY_LABELS = {
  TECHNIQUE: 'تحلیل تکنیک',
  TRAINING: 'تمرینی',
  COMPETITION: 'مسابقه',
  OTHER: 'سایر',
};

const VIDEO_CATEGORY_COLORS = {
  TECHNIQUE: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  TRAINING: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  COMPETITION: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  OTHER: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export const SwimmerRecordsTab = ({
  swimmer,
  records = [],
  videos = [],
  skillAssessments = [],
  onRefreshRecords,
  onRefreshVideos,
}) => {
  const toast = useToast();

  // Filters state
  const [selectedStrokeFilter, setSelectedStrokeFilter] = useState('ALL');
  const [selectedDistanceFilter, setSelectedDistanceFilter] = useState('ALL');

  // Chart Stroke selector: 'ALL' | 'FREESTYLE' | 'BACKSTROKE' | 'BREASTSTROKE' | 'BUTTERFLY' | 'MEDLEY'
  const [chartStroke, setChartStroke] = useState('ALL');
  const [chartType, setChartType] = useState('RECORDS'); // 'RECORDS' | 'SKILLS'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [newRecordForm, setNewRecordForm] = useState({
    stroke: 'FREESTYLE',
    distance_meters: 50,
    duration_seconds: '',
    minutes_part: '0',
    seconds_part: '',
    pool_course: 'SHORT_25M',
    recorded_at: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    category: 'TECHNIQUE',
  });

  // KPI Calculations
  const verifiedRecordsCount = useMemo(() => {
    return records.filter((r) => r.verification_status === 'VERIFIED').length;
  }, [records]);

  const bestRecord = useMemo(() => {
    if (!records || records.length === 0) return null;
    return [...records].sort((a, b) => {
      // Prioritize 50m fastest, then generally minimum duration_seconds
      const secA = Number(a.duration_seconds || 9999);
      const secB = Number(b.duration_seconds || 9999);
      return secA - secB;
    })[0];
  }, [records]);

  const passedSkillsCount = useMemo(() => {
    return skillAssessments.filter((s) => s.status === 'PASSED').length;
  }, [skillAssessments]);

  // Unique distances in records for filter dropdown
  const availableDistances = useMemo(() => {
    const set = new Set(records.map((r) => r.distance_meters).filter(Boolean));
    return Array.from(set).sort((a, b) => a - b);
  }, [records]);

  // Filtered records list
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedStrokeFilter !== 'ALL' && r.stroke !== selectedStrokeFilter) return false;
      if (selectedDistanceFilter !== 'ALL' && Number(r.distance_meters) !== Number(selectedDistanceFilter)) return false;
      return true;
    });
  }, [records, selectedStrokeFilter, selectedDistanceFilter]);

  // Chart Data preparation: Sorted chronologically by recorded_at
  const chartRecordsData = useMemo(() => {
    let source = [...records];
    if (chartStroke !== 'ALL') {
      source = source.filter((r) => r.stroke === chartStroke);
    }
    // Sort oldest first for progression trend
    source.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

    return source.map((r, idx) => {
      const shamsi = toShamsiDate(r.recorded_at)?.shortNumeric || r.recorded_at;
      const strokeLabel = STROKE_LABELS[r.stroke] || r.stroke_display || r.stroke;
      const timeVal = Number(r.duration_seconds || 0);

      return {
        id: r.id,
        index: idx,
        label: shamsi,
        shamsiDate: shamsi,
        value: timeVal,
        formattedTime: r.formatted_time || `${timeVal.toFixed(2)}s`,
        distance: r.distance_meters,
        stroke: r.stroke,
        strokeLabel,
        poolCourse: r.pool_course === 'LONG_50M' ? 'استخر ۵۰ متر' : 'استخر ۲۵ متر',
        notes: r.notes,
        isVerified: r.verification_status === 'VERIFIED',
      };
    });
  }, [records, chartStroke]);

  // Chart Skills Data preparation
  const chartSkillsData = useMemo(() => {
    let source = [...skillAssessments];
    source.sort((a, b) => new Date(a.assessed_at || a.created_at) - new Date(b.assessed_at || b.created_at));

    return source.map((s, idx) => {
      const shamsi = toShamsiDate(s.assessed_at || s.created_at)?.shortNumeric || '';
      return {
        id: s.id,
        index: idx,
        label: shamsi || `مهارت ${idx + 1}`,
        shamsiDate: shamsi,
        value: Number(s.score || 0),
        skillName: s.skill_name || 'آزمون مهارتی',
        status: s.status_display || s.status,
        feedback: s.feedback || s.notes,
      };
    });
  }, [skillAssessments]);

  // Calculate improvement comparison (First record vs Latest record for selected stroke)
  const progressionSummary = useMemo(() => {
    if (chartRecordsData.length < 2) return null;
    const first = chartRecordsData[0];
    const latest = chartRecordsData[chartRecordsData.length - 1];
    const diff = latest.value - first.value; // Negative diff means faster time (improvement!)
    const percent = Math.abs((diff / first.value) * 100).toFixed(1);

    return {
      isImprovement: diff <= 0,
      diffSeconds: Math.abs(diff).toFixed(2),
      percent,
      firstTime: first.formattedTime,
      latestTime: latest.formattedTime,
    };
  }, [chartRecordsData]);

  // Handle Verify a Record
  const handleVerifyRecord = async (recordId) => {
    try {
      await api.post(`/assessments/records/${recordId}/verify/`, {
        action: 'VERIFY',
      });
      toast.success('رکورد زمانی با موفقیت تأیید رسمی گردید.');
      if (onRefreshRecords) onRefreshRecords();
    } catch (err) {
      console.error(err);
      toast.error('خطا در تأیید رکورد شناگر');
    }
  };

  // Handle Submit New Record
  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingRecord(true);
      const mins = parseFloat(newRecordForm.minutes_part) || 0;
      const secs = parseFloat(newRecordForm.seconds_part) || 0;
      const totalSec = mins * 60 + secs;

      if (totalSec <= 0) {
        toast.error('لطفاً زمان معتبری برای رکورد وارد فرمایید.');
        return;
      }

      const payload = {
        swimmer: swimmer.id,
        stroke: newRecordForm.stroke,
        distance_meters: parseInt(newRecordForm.distance_meters, 10),
        duration_seconds: totalSec.toFixed(2),
        pool_course: newRecordForm.pool_course,
        recorded_at: newRecordForm.recorded_at,
        notes: newRecordForm.notes.trim(),
      };

      await api.post('/assessments/records/', payload);
      toast.success('رکورد جدید شناگر با موفقیت ثبت شد.');
      setIsRecordModalOpen(false);
      setNewRecordForm({
        stroke: 'FREESTYLE',
        distance_meters: 50,
        duration_seconds: '',
        minutes_part: '0',
        seconds_part: '',
        pool_course: 'SHORT_25M',
        recorded_at: new Date().toISOString().split('T')[0],
        notes: '',
      });
      if (onRefreshRecords) onRefreshRecords();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت رکورد زمانی شناگر');
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  // Handle Upload Video
  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      toast.error('لطفاً یک فایل ویدئویی انتخاب فرمایید.');
      return;
    }

    try {
      setIsUploadingVideo(true);
      setUploadProgress(10);

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('swimmer', swimmer.id);
      formData.append('category', videoForm.category);
      if (videoForm.title.trim()) {
        formData.append('title', videoForm.title.trim());
      } else {
        formData.append('title', `ویدئوی تحلیل تکنیک شناگر - ${swimmer.full_name}`);
      }
      if (videoForm.description.trim()) {
        formData.append('description', videoForm.description.trim());
      }

      await api.post('/swimmers/videos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        },
      });

      toast.success('فیلم شنا با موفقیت بارگذاری شد.');
      setIsVideoModalOpen(false);
      setVideoFile(null);
      setVideoForm({ title: '', description: '', category: 'TECHNIQUE' });
      setUploadProgress(0);
      if (onRefreshVideos) onRefreshVideos();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در بارگذاری فیلم شناگر');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Handle Delete Video
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('آیا از حذف این ویدئو از پرونده شناگر اطمینان دارید؟')) return;
    try {
      await api.delete(`/swimmers/videos/${videoId}/`);
      toast.success('ویدئوی مورد نظر با موفقیت حذف گردید.');
      if (onRefreshVideos) onRefreshVideos();
    } catch (err) {
      console.error(err);
      toast.error('خطا در حذف ویدئو');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/60">
              <Award className="w-5 h-5" />
            </span>
            <span>پرونده تخصصی رکوردها، فیلم‌ها و نمودار پیشرفت</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            سوابق تایم‌های رسمی ثبت‌شده، تحلیل‌های تصویری مربیان و روند بهبود عملکرد ورزشی {swimmer.full_name}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            size="sm"
            onClick={() => setIsRecordModalOpen(true)}
            className="gap-1.5 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت رکورد زمانی جدید</span>
          </Button>
          <button
            type="button"
            onClick={() => setIsVideoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>آپلود فیلم شنا</span>
          </button>
        </div>
      </div>

      {/* 2. Record Statistics KPI Cards (آمار رکوردها) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Records */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 group hover:border-sky-300 dark:hover:border-sky-700 transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
              تعداد رکوردهای ثبت‌شده
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800 shrink-0 group-hover:scale-105 transition-transform">
              <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {records.length}
              </span>
              <span className="text-xs font-bold text-slate-500">رکورد</span>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-sky-600 dark:text-sky-400 mt-1 block">
              {verifiedRecordsCount} رکورد رسمی و تأییدشده
            </span>
          </div>
        </div>

        {/* Card 2: Personal Best */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-transparent dark:from-amber-950/30 dark:via-amber-900/15 dark:to-transparent border border-amber-200/90 dark:border-amber-800/80 shadow-xs flex flex-col justify-between gap-3 group hover:border-amber-400 dark:hover:border-amber-700 transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">
              بهترین رکورد ثبت‌شده (PB)
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 shrink-0 group-hover:scale-105 transition-transform">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums tracking-tight">
                {bestRecord ? bestRecord.formatted_time || `${bestRecord.duration_seconds}s` : '—'}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-amber-800/80 dark:text-amber-400 mt-1 block truncate">
              {bestRecord
                ? `${bestRecord.distance_meters}متر ${bestRecord.stroke_display || STROKE_LABELS[bestRecord.stroke] || ''}`
                : 'هنوز رکوردی ثبت نشده'}
            </span>
          </div>
        </div>

        {/* Card 3: Videos Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 group hover:border-purple-300 dark:hover:border-purple-700 transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
              فیلم‌های تحلیل تکنیک
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 shrink-0 group-hover:scale-105 transition-transform">
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {videos.length}
              </span>
              <span className="text-xs font-bold text-slate-500">ویدئو</span>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1 block">
              آنالیز حرکات زیر آب و روی آب
            </span>
          </div>
        </div>

        {/* Card 4: Mastered Skills */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 group hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
              مهارت‌های کسب‌شده
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {passedSkillsCount}
              </span>
              <span className="text-xs font-bold text-slate-500">مهارت قبولی</span>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
              از مجموع {skillAssessments.length} ارزیابی مربیان
            </span>
          </div>
        </div>
      </div>

      {/* 3. Progress Chart Section (نمودار پیشرفت شناگر) */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        {/* Chart Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  نمودار تحلیل پیشرفت ورزشی شناگر
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  ⚡ زمان کمتر = رکورد سریع‌تر
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                روند کاهش زمان‌های ثبت‌شده در طول جلسات تمرینی و رقابت‌ها
              </p>
            </div>
          </div>

          {/* Toggle between Records and Skills Charts */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setChartType('RECORDS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartType === 'RECORDS'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                تایم‌های زمانی
              </button>
              <button
                type="button"
                onClick={() => setChartType('SKILLS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartType === 'SKILLS'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                نمرات مهارتی ({skillAssessments.length})
              </button>
            </div>
          </div>
        </div>

        {/* Stroke Filter pills for Records Chart */}
        {chartType === 'RECORDS' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 ml-1">
              ماده شنا:
            </span>
            {[
              { key: 'ALL', label: 'همه سبک‌ها' },
              { key: 'FREESTYLE', label: 'کرال سینه (آزاد)' },
              { key: 'BACKSTROKE', label: 'کرال پشت' },
              { key: 'BREASTSTROKE', label: 'قورباغه' },
              { key: 'BUTTERFLY', label: 'پروانه' },
              { key: 'MEDLEY', label: 'مختلط' },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setChartStroke(st.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  chartStroke === st.key
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}

        {/* Progression Comparison Metric Box */}
        {chartType === 'RECORDS' && progressionSummary && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-xl ${progressionSummary.isImprovement ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                {progressionSummary.isImprovement ? (
                  <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                )}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {progressionSummary.isImprovement
                  ? `بهبود و کاهش ${progressionSummary.diffSeconds} ثانیه‌ای رکورد (${progressionSummary.percent}٪ پیشرفت)`
                  : `تغییر ${progressionSummary.diffSeconds} ثانیه‌ای زمان در مقایسه با اولین ثبت`}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono font-bold text-slate-600 dark:text-slate-300">
              <span>اولین: {progressionSummary.firstTime}</span>
              <span className="text-slate-400">←</span>
              <span className="text-emerald-600 dark:text-emerald-400">آخرین: {progressionSummary.latestTime}</span>
            </div>
          </div>
        )}

        {/* Interactive SVG Smooth Area/Line Chart */}
        {chartType === 'RECORDS' ? (
          chartRecordsData.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/80 space-y-3">
              <Timer className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                داده‌ای برای رسم نمودار در این سبک شنا وجود ندارد.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsRecordModalOpen(true)}
                className="gap-1.5 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت اولین رکورد در این سبک</span>
              </Button>
            </div>
          ) : (
            <div className="relative w-full space-y-2">
              {/* Dynamic Tooltip / Legend Bar */}
              <div className="min-h-[32px] flex items-center justify-between gap-2 px-1">
                {hoveredPoint ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-bold">
                    <span>{hoveredPoint.shamsiDate}:</span>
                    <span>{hoveredPoint.distance}متر {hoveredPoint.strokeLabel}</span>
                    <span className="font-mono text-sky-600 dark:text-sky-400 font-black">
                      {hoveredPoint.formattedTime}
                    </span>
                    {hoveredPoint.notes && (
                      <span className="text-slate-500 font-normal">({hoveredPoint.notes})</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    ماوس را روی نقاط نمودار حرکت دهید تا جزئیات هر رکورد نمایش داده شود.
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-slate-500">
                  {chartRecordsData.length} نقطه زمانی
                </span>
              </div>

              {/* Render Smooth SVG Chart */}
              <div className="w-full overflow-hidden rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 p-4 border border-slate-200/80 dark:border-slate-800">
                {(() => {
                  const data = chartRecordsData;
                  const width = 600;
                  const height = 180;
                  const paddingX = 30;
                  const paddingY = 24;
                  const effectiveWidth = width - paddingX * 2;
                  const effectiveHeight = height - paddingY * 2;

                  const values = data.map((d) => d.value);
                  const minVal = Math.min(...values);
                  const maxVal = Math.max(...values);
                  const range = maxVal - minVal || (minVal * 0.1) || 1;

                  // Map points
                  const points = data.map((d, i) => {
                    const x = data.length === 1
                      ? width / 2
                      : paddingX + (i / (data.length - 1)) * effectiveWidth;
                    // Lower time = faster = higher on graph! So invert Y:
                    const normalized = (d.value - minVal) / range;
                    // Put minimum value (fastest) near the top (smaller Y):
                    const y = paddingY + normalized * effectiveHeight;
                    return { ...d, x, y };
                  });

                  // Construct paths
                  const linePath = points.reduce((acc, pt, i) => {
                    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                  }, '');

                  const areaPath = points.length > 1
                    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY / 2} L ${points[0].x} ${height - paddingY / 2} Z`
                    : '';

                  return (
                    <div>
                      <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-auto overflow-visible select-none"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="swimmerRecordGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Dashed Grid Lines */}
                        <line
                          x1={paddingX}
                          y1={paddingY}
                          x2={width - paddingX}
                          y2={paddingY}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-700"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <line
                          x1={paddingX}
                          y1={height / 2}
                          x2={width - paddingX}
                          y2={height / 2}
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-700"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <line
                          x1={paddingX}
                          y1={height - paddingY}
                          x2={width - paddingX}
                          y2={height - paddingY}
                          stroke="currentColor"
                          className="text-slate-300 dark:text-slate-600"
                          strokeWidth="1"
                        />

                        {/* Area Fill */}
                        {areaPath && <path d={areaPath} fill="url(#swimmerRecordGrad)" />}

                        {/* Main Line */}
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Point Circles */}
                        {points.map((pt, i) => (
                          <g key={i}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredPoint?.id === pt.id ? 6.5 : 4.5}
                              fill="#0284c7"
                              stroke="#ffffff"
                              strokeWidth="2.5"
                              className="transition-all duration-150"
                            />
                            {/* Hitbox */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="16"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredPoint(pt)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        ))}
                      </svg>

                      {/* X-axis date labels */}
                      <div className="flex justify-between items-center px-2 pt-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>{data[0]?.label}</span>
                        {data.length > 2 && (
                          <span>{data[Math.floor(data.length / 2)]?.label}</span>
                        )}
                        <span>{data[data.length - 1]?.label}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )
        ) : (
          /* Skills Assessments Chart View */
          chartSkillsData.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/80 text-slate-500 text-sm">
              هنوز ارزیابی مهارتی برای این شناگر ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {chartSkillsData.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {s.skillName}
                      </span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {s.value} / ۱۰۰
                      </span>
                    </div>
                    {/* Score Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, s.value)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>{s.status}</span>
                      <span className="font-mono">{s.shamsiDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* 4. Swimmer Technique & Training Videos (فیلم‌های مربوط به شناگر) */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Section Header */}
        <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/80 shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  فیلم‌های مربوط به شناگر و آنالیز تکنیک
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <span className="font-mono tabular-nums">{videos.length}</span> ویدئو
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                ویدئوهای ضبط‌شده تمرینات، زیر آب، استارت و برگشت سالتو و مسابقات رسمی
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsVideoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>بارگذاری فیلم جدید</span>
          </button>
        </div>

        {/* Video Gallery Grid */}
        {videos.length === 0 ? (
          <div className="text-center py-12 px-6 max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
              <FileVideo className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              هنوز فیلمی برای تحلیل تکنیک این شناگر بارگذاری نشده است.
            </p>
            <p className="text-xs text-slate-500">
              شما می‌توانید ویدئوهای ضبط‌شده تمرینی یا مسابقات را جهت بازبینی و تحلیل به پرونده شناگر ضمیمه فرمایید.
            </p>
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>بارگذاری اولین ویدئو</span>
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {videos.map((v) => {
              const videoSrc = v.video_url || v.video;
              const categoryBadge = VIDEO_CATEGORY_COLORS[v.category] || VIDEO_CATEGORY_COLORS.OTHER;
              const categoryText = v.category_display || VIDEO_CATEGORY_LABELS[v.category] || 'تحلیل تکنیک';
              const uploadDateShamsi = toShamsiDate(v.created_at || v.uploaded_at)?.shortNumeric;

              return (
                <div
                  key={v.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 overflow-hidden hover:shadow-xs transition-shadow flex flex-col justify-between group"
                >
                  {/* HTML5 Video Player */}
                  <div className="relative bg-slate-950 aspect-video flex items-center justify-center">
                    <video
                      src={videoSrc}
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Video Meta Info */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate" title={v.title}>
                          {v.title || 'ویدئوی شناگر'}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border shrink-0 ${categoryBadge}`}>
                          {categoryText}
                        </span>
                      </div>
                      {v.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mt-1.5">
                          {v.description}
                        </p>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-between pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>توسط: {v.uploaded_by_name || v.uploaded_by || 'مدیر آموزشگاه'}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums">{uploadDateShamsi}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(v.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                          title="حذف ویدئو"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Records List & Management (فهرست رکوردهای ثبت‌شده) */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                فهرست رکوردهای زمانی ثبت‌شده
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                مشاهده تایم‌ها، مسافت‌ها و وضعیت تأییدیه رسمی هر رکورد
              </p>
            </div>
          </div>

          {/* Stroke and Distance Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStrokeFilter}
              onChange={(e) => setSelectedStrokeFilter(e.target.value)}
              className="text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">همه سبک‌ها</option>
              <option value="FREESTYLE">کرال سینه (آزاد)</option>
              <option value="BACKSTROKE">کرال پشت</option>
              <option value="BREASTSTROKE">شنای قورباغه</option>
              <option value="BUTTERFLY">شنای پروانه</option>
              <option value="MEDLEY">مختلط انفرادی</option>
            </select>

            {availableDistances.length > 0 && (
              <select
                value={selectedDistanceFilter}
                onChange={(e) => setSelectedDistanceFilter(e.target.value)}
                className="text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">همه مسافت‌ها</option>
                {availableDistances.map((d) => (
                  <option key={d} value={d}>{d} متر</option>
                ))}
              </select>
            )}

            <Button
              size="sm"
              onClick={() => setIsRecordModalOpen(true)}
              className="gap-1.5 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت رکورد</span>
            </Button>
          </div>
        </div>

        {/* Records Grid */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 px-6 max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Timer className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              هنوز هیچ رکورد زمانی با این مشخصات ثبت نشده است.
            </p>
            <Button
              size="sm"
              onClick={() => setIsRecordModalOpen(true)}
              className="gap-1.5 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت اولین رکورد شناگر</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map((rec) => {
              const strokeStyle = STROKE_COLORS[rec.stroke] || STROKE_COLORS.FREESTYLE;
              const strokeText = rec.stroke_display || STROKE_LABELS[rec.stroke] || rec.stroke;
              const recShamsi = toShamsiDate(rec.recorded_at)?.shortNumeric || rec.recorded_at;
              const isVerified = rec.verification_status === 'VERIFIED';

              return (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5 hover:shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border ${strokeStyle.badge}`}>
                        {strokeText}
                      </span>
                      <Badge variant={isVerified ? 'success' : 'warning'} size="sm">
                        {isVerified ? 'تأیید رسمی' : 'در انتظار بررسی'}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          {rec.distance_meters} متر
                        </span>
                        <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono tabular-nums">
                          {rec.formatted_time || `${Number(rec.duration_seconds).toFixed(2)}s`}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        {rec.pool_course === 'LONG_50M' ? 'استخر ۵۰ متر (المپیک)' : 'استخر ۲۵ متر (کوتاه)'}
                      </span>
                    </div>

                    {rec.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                        {rec.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono">{recShamsi}</span>
                    {!isVerified && (
                      <button
                        type="button"
                        onClick={() => handleVerifyRecord(rec.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تأیید رسمی این رکورد</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: New Swimming Record */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title={`ثبت رکورد زمانی جدید: ${swimmer.full_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitRecord} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ماده / سبک شنا *
              </label>
              <select
                value={newRecordForm.stroke}
                onChange={(e) => setNewRecordForm((p) => ({ ...p, stroke: e.target.value }))}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200"
                required
              >
                <option value="FREESTYLE">کرال سینه (آزاد)</option>
                <option value="BACKSTROKE">کرال پشت</option>
                <option value="BREASTSTROKE">شنای قورباغه</option>
                <option value="BUTTERFLY">شنای پروانه</option>
                <option value="MEDLEY">مختلط انفرادی</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                مسافت (متر) *
              </label>
              <select
                value={newRecordForm.distance_meters}
                onChange={(e) => setNewRecordForm((p) => ({ ...p, distance_meters: e.target.value }))}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 font-mono"
                required
              >
                <option value="25">۲۵ متر</option>
                <option value="50">۵۰ متر</option>
                <option value="100">۱۰۰ متر</option>
                <option value="200">۲۰۰ متر</option>
                <option value="400">۴۰۰ متر</option>
                <option value="800">۸۰۰ متر</option>
                <option value="1500">۱۵۰۰ متر</option>
              </select>
            </div>
          </div>

          {/* Time input: Minutes and Seconds */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              زمان ثبت‌شده *
            </label>
            <div className="grid grid-cols-2 gap-3" dir="ltr">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">دقیقه (Min):</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={newRecordForm.minutes_part}
                  onChange={(e) => setNewRecordForm((p) => ({ ...p, minutes_part: e.target.value }))}
                  placeholder="0"
                  className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-center font-bold"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">ثانیه و صدم (Sec.xx):</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="59.99"
                  value={newRecordForm.seconds_part}
                  onChange={(e) => setNewRecordForm((p) => ({ ...p, seconds_part: e.target.value }))}
                  placeholder="28.45"
                  className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-center font-bold text-sky-600"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نوع استخر
              </label>
              <select
                value={newRecordForm.pool_course}
                onChange={(e) => setNewRecordForm((p) => ({ ...p, pool_course: e.target.value }))}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200"
              >
                <option value="SHORT_25M">استخر ۲۵ متر (مسافت کوتاه)</option>
                <option value="LONG_50M">استخر ۵۰ متر (المپیک)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تاریخ ثبت رکورد
              </label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={newRecordForm.recorded_at}
                onChange={(e) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  if (e.target.value && e.target.value > todayStr) return;
                  setNewRecordForm((p) => ({ ...p, recorded_at: e.target.value }));
                }}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              شرایط مسابقه / یادداشت داور (اختیاری)
            </label>
            <input
              type="text"
              value={newRecordForm.notes}
              onChange={(e) => setNewRecordForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="مثال: مسابقات استانی، ارزیابی پایان دوره، تمرین سرعتی"
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRecordModalOpen(false)}
              className="text-xs"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingRecord}
              className="text-xs font-bold gap-1.5"
            >
              {isSubmittingRecord ? 'در حال ثبت...' : 'ثبت قطعی رکورد'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Upload Swim Video */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title={`آپلود فیلم تحلیل تکنیک شناگر: ${swimmer.full_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleUploadVideo} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              انتخاب فایل ویدئویی *
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                required
              />
              <Upload className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              {videoFile ? (
                <div className="text-xs font-bold text-purple-700 dark:text-purple-300 truncate px-2">
                  فایل انتخاب‌شده: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    برای انتخاب فایل کلیک کنید یا آن را به این بخش بکشید
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    فرمت‌های مجاز: MP4, WebM, MOV, MKV
                  </p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              عنوان فیلم
            </label>
            <input
              type="text"
              value={videoForm.title}
              onChange={(e) => setVideoForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="مثال: آنالیز زیرآب کرال سینه و زاویه دست‌ها"
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              دسته‌بندی ویدئو
            </label>
            <select
              value={videoForm.category}
              onChange={(e) => setVideoForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200"
            >
              <option value="TECHNIQUE">تحلیل تکنیک (زیرآب، استارت، برگشت)</option>
              <option value="TRAINING">تمرینی و دوره‌ای</option>
              <option value="COMPETITION">مسابقه و لیگ رسمی</option>
              <option value="OTHER">سایر</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات و نکات تحلیلی مربی / مدیر
            </label>
            <textarea
              rows={3}
              value={videoForm.description}
              onChange={(e) => setVideoForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="نکات قابل توجه در خصوص تکنیک پا زدن، زاویه سر و ورود دست به آب..."
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200 resize-none"
            />
          </div>

          {isUploadingVideo && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-purple-700">
                <span>در حال بارگذاری ویدئو...</span>
                <span>{uploadProgress}٪</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsVideoModalOpen(false)}
              className="text-xs"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={isUploadingVideo || !videoFile}
              className="text-xs font-bold gap-1.5"
            >
              {isUploadingVideo ? 'در حال ارسال فایل...' : 'شروع بارگذاری'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
