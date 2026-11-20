import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, X, RotateCcw, Layers, Droplets, ChevronRight, ChevronLeft, ArrowRight, Play, Square,
  Save, Timer as TimerIcon, Flag, Users, ArrowLeftRight, MoveRight,
  LayoutGrid, Table, Video, Upload, Trash2, Film, Edit3, CheckCircle2, AlertCircle
} from 'lucide-react';

import api from '../../api/client';
import { Button } from '../../components/common/Button';
import { BackButton } from '../../components/common/BackButton';
import { CustomSelect } from '../../components/common/CustomSelect';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { toShamsiDate } from '../../utils/date';
import {
  SwimmerCrawlIcon,
  SwimmerButterflyIcon,
  SwimmerBreaststrokeIcon,
  SwimmerBackstrokeIcon,
  OlympicStopwatchIcon,
} from '../../components/common/AquaticIcons';

// ── ثابت‌های فرم ثبت رکورد ─────────────────────────────────────────────
const VIEW_PREF_KEY = 'iranswim_record_view';
const RECORD_MODE_KEY = 'iranswim_record_entry_mode';

const STROKES = [
  {
    value: 'BREASTSTROKE',
    label: 'قورباغه',
    fullLabel: 'شنای قورباغه',
    desc: 'پای قورباغه با کشش همزمان دست‌ها',
    Icon: SwimmerBreaststrokeIcon,
    accent: 'emerald',
  },
  {
    value: 'BUTTERFLY',
    label: 'پروانه',
    fullLabel: 'شنای پروانه',
    desc: 'حرکت دلفین؛ سنگین‌ترین و فنی‌ترین ماده',
    Icon: SwimmerButterflyIcon,
    accent: 'violet',
  },
  {
    value: 'FREESTYLE',
    label: 'کرال سینه',
    fullLabel: 'کرال سینه (آزاد)',
    desc: 'سریع‌ترین و پرکاربردترین سبک شنا',
    Icon: SwimmerCrawlIcon,
    accent: 'sky',
  },
  {
    value: 'BACKSTROKE',
    label: 'کرال پشت',
    fullLabel: 'شنای کرال پشت',
    desc: 'شنای پشت به آب با چرخش شانه‌ها',
    Icon: SwimmerBackstrokeIcon,
    accent: 'amber',
  },
];

const DISTANCES = [
  { value: 25, label: '۲۵ متر', desc: 'یک طول استخر' },
  { value: 50, label: '۵۰ متر', desc: 'دو طول استخر (اسپرینت)' },
  { value: 100, label: '۱۰۰ متر', desc: 'چهار طول استخر' },
  { value: 200, label: '۲۰۰ متر', desc: 'هشت طول استخر (میدل‌دیستنس)' },
];

const WIZARD_STEPS = [
  { id: 'stroke', title: 'نوع شنا', subtitle: 'انتخاب ماده', Icon: ArrowLeftRight },
  { id: 'distance', title: 'مسافت', subtitle: 'انتخاب متراژ', Icon: Flag },
  { id: 'timer', title: 'ثبت زمان', subtitle: 'کرنومتر یا دستی', Icon: TimerIcon },
];

// ── ابزار قالب‌بندی زمان: m:ss.cc (سانتی‌ثانیه) ────────────────────────
const formatStopwatch = (ms) => {
  const totalCs = Math.max(0, Math.floor(ms / 10));
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

// ── ابزار تحلیل و اعتبارسنجی زمان دستی واردشده (xx:xx یا xx:xx.xx یا ss.cc) ──
export const parseRecordTime = (val) => {
  if (!val) return null;
  // تبدیل ارقام فارسی و عربی به انگلیسی
  const str = String(val)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .trim();

  if (!str) return null;

  // الگوی اول: شامل دو نقطه : (مانند 01:25 یا 00:32 یا 28:45)
  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length === 2) {
      const part1 = parseFloat(parts[0]);
      const part2 = parseFloat(parts[1]);
      if (isNaN(part1) || isNaN(part2) || part1 < 0 || part2 < 0) return null;

      // اگر عدد اول بزرگ‌تر یا مساوی ۱۰ باشد و شامل اعشار نباشد (مانند 28:45)،
      // در شنا برای مسافت‌های استخر (۲۵ تا ۲۰۰ متر) هیچ شناگری ۲۸ دقیقه شنا نمی‌کند؛
      // این حالت مربوط به ثبت ثانیه:صدم‌ثانیه است.
      if (part1 >= 10 && part2 < 100 && !parts[1].includes('.')) {
        const total = Math.round((part1 + part2 / 100) * 100) / 100;
        return {
          totalSeconds: total,
          minutes: 0,
          seconds: Math.floor(part1),
          centiseconds: Math.round(part2),
          formatted: `${String(Math.floor(part1)).padStart(2, '0')}.${String(Math.round(part2)).padStart(2, '0')}`,
          displayFa: `${Math.floor(part1)} ثانیه و ${Math.round(part2)} صدم ثانیه`,
          isCentiseconds: true,
        };
      } else {
        // دقیقه:ثانیه استاندارد MM:SS یا MM:SS.cc
        const total = Math.round((part1 * 60 + part2) * 100) / 100;
        if (total <= 0) return null;
        const mins = Math.floor(total / 60);
        const remSec = total % 60;
        const secs = Math.floor(remSec);
        const cs = Math.round((remSec - secs) * 100);
        return {
          totalSeconds: total,
          minutes: mins,
          seconds: secs,
          centiseconds: cs,
          formatted: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}${cs > 0 ? '.' + String(cs).padStart(2, '0') : ''}`,
          displayFa: mins > 0 
            ? `${mins} دقیقه و ${secs} ثانیه${cs > 0 ? ` و ${cs} صدم` : ''}`
            : `${secs} ثانیه${cs > 0 ? ` و ${cs} صدم` : ''}`,
          isCentiseconds: false,
        };
      }
    }
  }

  // الگوی دوم: شامل ممیز اعشار . (مانند 28.45)
  if (str.includes('.')) {
    const total = parseFloat(str);
    if (!isNaN(total) && total > 0) {
      const mins = Math.floor(total / 60);
      const remSec = total % 60;
      const secs = Math.floor(remSec);
      const cs = Math.round((remSec - secs) * 100);
      return {
        totalSeconds: Math.round(total * 100) / 100,
        minutes: mins,
        seconds: secs,
        centiseconds: cs,
        formatted: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`,
        displayFa: mins > 0 
          ? `${mins} دقیقه و ${secs} ثانیه و ${cs} صدم`
          : `${secs} ثانیه و ${cs} صدم ثانیه`,
        isCentiseconds: false,
      };
    }
  }

  // الگوی سوم: عدد صحیح تنها (مانند 35 -> 35 ثانیه)
  const num = parseFloat(str);
  if (!isNaN(num) && num > 0) {
    const mins = Math.floor(num / 60);
    const secs = num % 60;
    return {
      totalSeconds: num,
      minutes: mins,
      seconds: secs,
      centiseconds: 0,
      formatted: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      displayFa: mins > 0 ? `${mins} دقیقه و ${secs} ثانیه` : `${secs} ثانیه`,
      isCentiseconds: false,
    };
  }

  return null;
};

export const CoachRecordPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkHandledRef = useRef(false);

  // ── تب فعال پس از انتخاب شناگر: رکورد زمانی / آپلود فیلم ──
  const [activeTab, setActiveTab] = useState('record');

  // ── داده شناگران و کلاس‌ها ──
  const [swimmers, setSwimmers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── فیلترهای مرحله انتخاب شناگر: جست‌وجو، دوره، استخر ──
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPool, setSelectedPool] = useState('');

  // ── حالت نمایش لیست شناگران: کارت / جدول (با ذخیره انتخاب کاربر) ──
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(VIEW_PREF_KEY) === 'table' ? 'table' : 'cards';
    } catch {
      return 'cards';
    }
  });
  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_PREF_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  // ── ویزارد ثبت رکورد ──
  const [selectedSwimmer, setSelectedSwimmer] = useState(null); // { swimmer_id, full_name, avatar }
  const [wizardStep, setWizardStep] = useState(0); // 0=stroke, 1=distance, 2=timer
  const [stroke, setStroke] = useState('');
  const [distance, setDistance] = useState(null);

  // ── زمان‌سنج و ثبت دستی ──
  const [recordMode, setRecordMode] = useState(() => {
    try {
      return localStorage.getItem(RECORD_MODE_KEY) === 'manual' ? 'manual' : 'stopwatch';
    } catch {
      return 'stopwatch';
    }
  });
  const [manualTime, setManualTime] = useState('');
  const [timerState, setTimerState] = useState('idle'); // idle | running | stopped
  const [elapsedMs, setElapsedMs] = useState(0);
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef(null);
  const startTsRef = useRef(0);

  const handleSetRecordMode = (mode) => {
    setRecordMode(mode);
    try {
      localStorage.setItem(RECORD_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const handleManualTimeChange = (e) => {
    let val = e.target.value;
    // تبدیل ارقام فارسی و عربی به انگلیسی
    val = val
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

    // مجاز شمردن فقط ارقام، دو نقطه و ممیز
    val = val.replace(/[^0-9:.]/g, '');

    // اگر کاربر ۴ رقم پیوسته تایپ کرد (مانند 0125)، به صورت خودکار 01:25 شود
    if (/^\d{4}$/.test(val)) {
      val = `${val.slice(0, 2)}:${val.slice(2)}`;
    }

    setManualTime(val);
  };

  // ── آپلود فیلم شناگر ──
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const fileInputRef = useRef(null);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // پاک‌سازی تایمر هنگام unmount
  useEffect(() => clearTimerInterval, [clearTimerInterval]);

  // ── دریافت شناگران مربی (کلاس‌ها + همه صفحات ثبت‌نام‌ها) ──
  useEffect(() => {
    let isMounted = true;

    const fetchAllEnrollments = async () => {
      const firstRes = await api.get('/education/enrollments/');
      const firstData = firstRes.data;
      if (Array.isArray(firstData)) return firstData;

      const allItems = [...(firstData?.results || [])];
      let next = firstData?.next;
      let page = 2;
      while (next && page <= 50) {
        const pageRes = await api.get('/education/enrollments/', { params: { page } });
        const pageData = pageRes.data;
        allItems.push(...(pageData?.results || (Array.isArray(pageData) ? pageData : [])));
        next = pageData?.next;
        page += 1;
      }
      return allItems;
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        const enrList = await fetchAllEnrollments();
        if (!isMounted) return;

        const uniqueSwimmersMap = {};
        enrList.forEach((en) => {
          if (!uniqueSwimmersMap[en.swimmer]) {
            uniqueSwimmersMap[en.swimmer] = {
              swimmer_id: en.swimmer,
              full_name: en.swimmer_name || 'بدون نام',
              avatar: en.swimmer_avatar,
              phone: en.swimmer_phone,
              enrollments: [],
            };
          }
          uniqueSwimmersMap[en.swimmer].enrollments.push({
            id: en.id,
            course_id: en.course,
            course_name: en.course_name,
            pool: en.course_pool,
            group_name: en.group_name,
          });
        });
        setSwimmers(Object.values(uniqueSwimmersMap));
      } catch (err) {
        console.error('Error fetching swimmers for record:', err);
        if (isMounted) toast.error('خطا در دریافت لیست شناگران');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [toast]);

  // ── گزینه‌های فیلتر دوره ──
  const courseOptions = useMemo(() => {
    const seen = new Map();
    swimmers.forEach((sw) => {
      sw.enrollments.forEach((en) => {
        if (en.course_id && !seen.has(String(en.course_id))) {
          seen.set(String(en.course_id), en.course_name || `دوره ${en.course_id}`);
        }
      });
    });
    const items = Array.from(seen.entries()).map(([value, label]) => ({
      value,
      label,
      icon: Layers,
    }));
    return [
      { value: '', label: 'همه دوره‌ها', icon: Layers, description: 'نمایش شناگران تمام دوره‌های من' },
      ...items,
    ];
  }, [swimmers]);

  // ── گزینه‌های فیلتر استخر (از محل برگزاری دوره‌ها) ──
  const poolOptions = useMemo(() => {
    const seen = new Set();
    swimmers.forEach((sw) => {
      sw.enrollments.forEach((en) => {
        const pool = (en.pool || '').trim();
        if (pool) seen.add(pool);
      });
    });
    const items = Array.from(seen).map((pool) => ({
      value: pool,
      label: pool,
      icon: Droplets,
    }));
    return [
      { value: '', label: 'همه استخرها', icon: Droplets, description: 'نمایش شناگران بدون محدودیت استخر' },
      ...items,
    ];
  }, [swimmers]);

  // ── فیلتر نهایی شناگران ──
  const filteredSwimmers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return swimmers
      .map((sw) => {
        const matching = sw.enrollments.filter(
          (en) =>
            (!selectedCourse || String(en.course_id) === String(selectedCourse)) &&
            (!selectedPool || (en.pool || '').trim() === selectedPool)
        );
        if (matching.length === 0) return null;

        const matchesSearch =
          !q ||
          sw.full_name?.toLowerCase().includes(q) ||
          matching.some(
            (en) =>
              en.course_name?.toLowerCase().includes(q) ||
              en.group_name?.toLowerCase().includes(q)
          );
        if (!matchesSearch) return null;

        return { ...sw, displayEnrollments: matching };
      })
      .filter(Boolean);
  }, [swimmers, searchTerm, selectedCourse, selectedPool]);

  const hasActiveFilter = Boolean(
    searchTerm.trim() || selectedCourse !== '' || selectedPool !== ''
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
    setSelectedPool('');
  };

  // ── انتخاب شناگر و شروع ویزارد ──
  const handleSelectSwimmer = (sw, initialTab = 'record') => {
    setSelectedSwimmer({ swimmer_id: sw.swimmer_id, full_name: sw.full_name, avatar: sw.avatar });
    setWizardStep(0);
    setStroke('');
    setDistance(null);
    resetTimer();
    setManualTime('');
    resetVideoForm();
    setActiveTab(initialTab);
  };

  const handleBackToSwimmers = () => {
    setSelectedSwimmer(null);
    resetTimer();
    setManualTime('');
    resetVideoForm();
  };

  const handleBackStep = () => {
    if (wizardStep === 0) {
      handleBackToSwimmers();
      return;
    }
    if (timerState === 'running') clearTimerInterval();
    resetTimer();
    setManualTime('');
    setWizardStep((s) => s - 1);
  };

  // ── کنترل‌های زمان‌سنج ──
  const resetTimer = () => {
    clearTimerInterval();
    startTsRef.current = 0;
    setElapsedMs(0);
    setTimerState('idle');
  };

  const handleStart = () => {
    clearTimerInterval();
    startTsRef.current = performance.now();
    setElapsedMs(0);
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setElapsedMs(performance.now() - startTsRef.current);
    }, 27);
  };

  const handleStop = () => {
    clearTimerInterval();
    const finalMs = performance.now() - startTsRef.current;
    setElapsedMs(finalMs);
    setTimerState('stopped');
  };

  const handleCancel = () => {
    resetTimer();
    toast.info('زمان‌گیری لغو شد.');
  };

  // ── ثبت نهایی رکورد در پروفایل شناگر ──
  const handleSaveRecord = async () => {
    if (!stroke || !distance || !selectedSwimmer) return;

    let durationSeconds = 0;
    let recordNotes = '';

    if (recordMode === 'manual') {
      const parsed = parseRecordTime(manualTime);
      if (!parsed || parsed.totalSeconds <= 0) {
        toast.error('لطفاً زمان رکورد را با فرمت xx:xx وارد کنید.');
        return;
      }
      if (parsed.totalSeconds > 1200) {
        toast.error('زمان واردشده بیشتر از حد مجاز است.');
        return;
      }
      durationSeconds = parsed.totalSeconds;
      recordNotes = 'ثبت دستی';
    } else {
      if (timerState !== 'stopped' || elapsedMs <= 0) return;
      durationSeconds = Math.round((elapsedMs / 1000) * 100) / 100;
      recordNotes = '';
    }

    try {
      setSaving(true);
      await api.post('/assessments/records/', {
        swimmer: selectedSwimmer.swimmer_id,
        stroke,
        distance_meters: distance,
        duration_seconds: durationSeconds.toFixed(2),
        pool_course: 'SHORT_25M',
        recorded_at: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD محلی
        notes: recordNotes,
      });
      toast.success('رکورد با موفقیت ثبت شد و به پروفایل شناگر منتقل شد.');
      navigate(`/coach/progress/${selectedSwimmer.swimmer_id}`);
    } catch (err) {
      console.error('Error saving record:', err);
      toast.error(err.response?.data?.detail || err.response?.data?.swimmer?.[0] || 'ثبت رکورد ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  // ── دیپ‌لینک: /coach/records?swimmer=<id>&tab=video ──
  useEffect(() => {
    if (deepLinkHandledRef.current || loading) return;
    deepLinkHandledRef.current = true;
    const qsSwimmer = searchParams.get('swimmer');
    if (!qsSwimmer) return;
    const match = swimmers.find((sw) => String(sw.swimmer_id) === String(qsSwimmer));
    if (match) {
      setSelectedSwimmer({ swimmer_id: match.swimmer_id, full_name: match.full_name, avatar: match.avatar });
      if (searchParams.get('tab') === 'video') setActiveTab('video');
      setSearchParams({}, { replace: true });
    }
  }, [loading, swimmers, searchParams, setSearchParams]);

  // ── دریافت ویدئوهای بارگذاری‌شده شناگر ──
  const loadVideos = useCallback(async () => {
    if (!selectedSwimmer) return;
    try {
      setVideosLoading(true);
      const res = await api.get('/swimmers/videos/', {
        params: { swimmer_id: selectedSwimmer.swimmer_id },
      });
      setVideos(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error('Error fetching swimmer videos:', err);
      toast.error('خطا در دریافت ویدئوهای شناگر');
    } finally {
      setVideosLoading(false);
    }
  }, [selectedSwimmer, toast]);

  useEffect(() => {
    if (selectedSwimmer && activeTab === 'video') {
      loadVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedSwimmer]);

  // آزادسازی حافظه پیش‌نمایش ویدئو
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  // ── انتخاب/پاک‌سازی فایل ویدئو ──
  const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

  const formatFileSize = (bytes) => {
    if (bytes == null) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} کیلوبایت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
  };

  const handleVideoFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('لطفاً یک فایل ویدئو (mp4، mov، webm و...) انتخاب کنید.');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error('حجم ویدئو نباید بیشتر از ۲۰۰ مگابایت باشد.');
      return;
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const clearVideoFile = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetVideoForm = () => {
    clearVideoFile();
    setVideoTitle('');
    setVideoDescription('');
    setVideos([]);
  };

  // ── بارگذاری ویدئو در پروفایل شناگر ──
  const handleVideoUpload = async () => {
    if (!videoFile || !selectedSwimmer || uploading) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('swimmer', selectedSwimmer.swimmer_id);
      if (videoTitle.trim()) formData.append('title', videoTitle.trim());
      if (videoDescription.trim()) formData.append('description', videoDescription.trim());
      await api.post('/swimmers/videos/', formData, {
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      toast.success('ویدئو با موفقیت در پروفایل شناگر بارگذاری شد.');
      resetVideoForm();
      await loadVideos();
    } catch (err) {
      console.error('Error uploading swim video:', err);
      toast.error(err.response?.data?.video || err.response?.data?.detail || 'بارگذاری ویدئو ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      await api.delete(`/swimmers/videos/${videoId}/`);
      toast.success('ویدئو حذف شد.');
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err) {
      console.error('Error deleting swim video:', err);
      toast.error(err.response?.data?.detail || 'حذف ویدئو ناموفق بود.');
    }
  };

  // ═══════════════════ تب آپلود فیلم شناگر ═══════════════════
  const renderVideoSection = () => (
    <div className="space-y-4 sm:space-y-5">
      {/* فرم بارگذاری */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-5 sm:mb-7">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <Film className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-sky-600 dark:text-sky-400 shrink-0" />
            آپلود فیلم شنای شناگر
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            ویدئوی تمرین یا مسابقه را بارگذاری کنید تا در پروفایل شناگر نمایش داده شود؛ عنوان و توضیحات اختیاری است
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {/* ناحیه انتخاب/کشیدن و رها کردن فایل */}
          {videoPreviewUrl ? (
            <div className="relative rounded-2xl border border-emerald-300/70 dark:border-emerald-700 bg-slate-50 dark:bg-slate-800/50 p-3">
              <video
                src={videoPreviewUrl}
                controls
                preload="metadata"
                className="w-full max-h-64 sm:max-h-80 rounded-xl bg-slate-900"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 px-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[60%]">
                  {videoFile?.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formatFileSize(videoFile?.size)}
                  </span>
                  <button
                    type="button"
                    onClick={clearVideoFile}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    حذف فایل
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2.5 p-8 sm:p-10 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-800/40 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-label="انتخاب فایل ویدئو"
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>
              <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                انتخاب ویدئو یا کشیدن و رها کردن فایل
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                فرمت‌های mp4، mov، webm · حداکثر ۲۰۰ مگابایت
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/mp2t,video/*"
            className="hidden"
            onChange={(e) => handleVideoFileSelect(e.target.files?.[0])}
          />
          {/* رها کردن فایل روی کل کارت */}
          <div
            className="contents"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleVideoFileSelect(e.dataTransfer.files?.[0]);
            }}
          />

          {/* عنوان (اختیاری) */}
          <div>
            <label className="block text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
              عنوان ویدئو <span className="text-slate-400 font-medium">(اختیاری)</span>
            </label>
            <input
              type="text"
              placeholder="مثلاً: تحلیل تکنیک کرال سینه - جلسه ۱۲"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              maxLength={150}
              className="w-full min-h-[44px] px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
            />
          </div>

          {/* توضیحات (اختیاری) */}
          <div>
            <label className="block text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
              توضیحات <span className="text-slate-400 font-medium">(اختیاری)</span>
            </label>
            <textarea
              rows="3"
              placeholder="نکات مربی درباره تکنیک، نقاط قوت و ضعف شناگر..."
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 transition-all"
            />
          </div>

          {/* نوار پیشرفت + دکمه بارگذاری */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 text-center">
                در حال بارگذاری... {uploadProgress}٪
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleVideoUpload}
            disabled={!videoFile || uploading}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[50px] rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-black shadow-xs transition-all active:scale-[0.98] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="بارگذاری ویدئو"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>در حال بارگذاری...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>بارگذاری ویدئو در پروفایل</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ویدئوهای بارگذاری‌شده قبلی */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>ویدئوهای بارگذاری‌شده</span>
          </h3>
          <span className="shrink-0 text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold font-mono">
            {videos.length} ویدئو
          </span>
        </div>

        {videosLoading ? (
          <div className="p-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
            در حال دریافت ویدئوها...
          </div>
        ) : videos.length > 0 ? (
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 overflow-hidden"
              >
                <video
                  src={v.video_url || v.video}
                  controls
                  preload="metadata"
                  className="w-full max-h-56 sm:max-h-64 bg-slate-900"
                />
                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {v.title || 'ویدئوی بدون عنوان'}
                      </div>
                      {v.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1 line-clamp-3">
                          {v.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(v.id)}
                      className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                      title="حذف ویدئو"
                      aria-label="حذف ویدئو"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono">{toShamsiDate(v.created_at).shortNumeric || v.created_at}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>بارگذاری توسط: {v.uploaded_by_name || 'مربی'}</span>
                    {v.file_size != null && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="font-mono">{formatFileSize(v.file_size)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 space-y-2">
            <Video className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              هنوز ویدئویی برای این شناگر بارگذاری نشده است.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ── نوار پیشرفت ویزارد ──
  const renderStepper = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-3.5 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* شناگر انتخاب‌شده */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800">
            {selectedSwimmer?.avatar ? (
              <img
                src={selectedSwimmer.avatar}
                alt={selectedSwimmer.full_name}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="w-full h-full object-cover"
              />
            ) : (
              (selectedSwimmer?.full_name || 'ش').charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
              {selectedSwimmer?.full_name}
            </div>
            <button
              type="button"
              onClick={handleBackToSwimmers}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer inline-flex items-center gap-1 mt-0.5"
              title="بازگشت به انتخاب شناگر"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              تغییر شناگر
            </button>
          </div>
        </div>

        {/* مراحل با قابلیت کلیک روی مراحل سپری‌شده */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-end sm:justify-center min-w-0">
          {WIZARD_STEPS.map((step, idx) => {
            const isActive = idx === wizardStep;
            const isDone = idx < wizardStep;
            const StepIcon = step.Icon;
            return (
              <React.Fragment key={step.id}>
                {idx > 0 && (
                  <div
                    className={`h-0.5 w-6 sm:w-10 rounded-full transition-colors duration-300 ${
                      isDone ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isDone) {
                      if (timerState === 'running') clearTimerInterval();
                      setWizardStep(idx);
                    }
                  }}
                  disabled={!isDone && !isActive}
                  className={`flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl border transition-all duration-300 shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:border-emerald-400 cursor-pointer active:scale-95'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-default'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                  title={isDone ? `بازگشت به مرحله ${idx + 1}: ${step.title}` : step.title}
                >
                  <StepIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                  <div className="hidden sm:block leading-tight text-right">
                    <div className="text-xs font-black whitespace-nowrap">{step.title}</div>
                    <div className={`text-[10px] font-bold ${isActive ? 'text-emerald-100' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-70'}`}>
                      {isDone ? 'تغییر' : `مرحله ${idx + 1}`}
                    </div>
                  </div>
                  <span className="sm:hidden text-xs font-black">{idx + 1}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── کارت انتخاب (استفاده در مرحله ۱ و ۲) ──
  const accentClasses = {
    emerald: {
      selected: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/30',
      selectedIcon: 'bg-emerald-600 text-white',
      selectedText: 'text-emerald-800 dark:text-emerald-200',
      icon: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300',
    },
    violet: {
      selected: 'bg-violet-50 dark:bg-violet-950/50 border-violet-500 dark:border-violet-500 ring-2 ring-violet-500/30',
      selectedIcon: 'bg-violet-600 text-white',
      selectedText: 'text-violet-800 dark:text-violet-200',
      icon: 'bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300',
    },
    sky: {
      selected: 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 dark:border-sky-500 ring-2 ring-sky-500/30',
      selectedIcon: 'bg-sky-600 text-white',
      selectedText: 'text-sky-800 dark:text-sky-200',
      icon: 'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300',
    },
    amber: {
      selected: 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/30',
      selectedIcon: 'bg-amber-500 text-white',
      selectedText: 'text-amber-800 dark:text-amber-200',
      icon: 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300',
    },
    teal: {
      selected: 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 dark:border-teal-500 ring-2 ring-teal-500/30',
      selectedIcon: 'bg-teal-600 text-white',
      selectedText: 'text-teal-800 dark:text-teal-200',
      icon: 'bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300',
    },
  };

  // ═══════════════════ مرحله صفر: انتخاب شناگر ═══════════════════
  const renderSwimmerSelect = () => (
    <div className="space-y-4 sm:space-y-5">
      {/* فیلترها: جست‌وجو، دوره، استخر */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 lg:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3">
          {/* جست‌وجوی نام */}
          <div className="relative md:col-span-4">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="جست‌وجوی نام شناگر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[42px] pr-10 pl-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
              aria-label="جست‌وجوی نام شناگر"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="پاک کردن جست‌وجو"
                aria-label="پاک کردن جست‌وجو"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* فیلتر دوره */}
          <div className="md:col-span-4">
            <CustomSelect
              value={selectedCourse}
              onChange={(val) => setSelectedCourse(val || '')}
              options={courseOptions}
              icon={Layers}
              placeholder="فیلتر بر اساس دوره..."
              color="emerald"
              searchable={courseOptions.length > 5}
              clearable
              isActive={selectedCourse !== ''}
              align="auto"
            />
          </div>

          {/* فیلتر استخر */}
          <div className="md:col-span-4">
            <CustomSelect
              value={selectedPool}
              onChange={(val) => setSelectedPool(val || '')}
              options={poolOptions}
              icon={Droplets}
              placeholder="فیلتر بر اساس استخر..."
              color="sky"
              searchable={poolOptions.length > 5}
              clearable
              isActive={selectedPool !== ''}
              align="auto"
            />
          </div>
        </div>

        {/* خلاصه فیلترهای فعال */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span>
              نمایش{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{filteredSwimmers.length}</span>{' '}
              شناگر
            </span>
            {selectedCourse !== '' && (
              <button
                type="button"
                onClick={() => setSelectedCourse('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 font-semibold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer max-w-[210px]"
                title="حذف فیلتر دوره"
              >
                <span className="truncate">
                  {courseOptions.find((o) => o.value === String(selectedCourse))?.label || 'دوره انتخابی'}
                </span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
            {selectedPool !== '' && (
              <button
                type="button"
                onClick={() => setSelectedPool('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800 font-semibold text-xs hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors cursor-pointer max-w-[210px]"
                title="حذف فیلتر استخر"
              >
                <span className="truncate">{selectedPool}</span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
            {searchTerm.trim() !== '' && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer max-w-[180px]"
                title="حذف عبارت جست‌وجو"
              >
                <span className="truncate">«{searchTerm.trim()}»</span>
                <X className="w-3 h-3 shrink-0" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* سوییچ حالت نمایش: کارت / جدول */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
              role="group"
              aria-label="حالت نمایش لیست شناگران"
            >
              <button
                type="button"
                onClick={() => handleSetViewMode('cards')}
                aria-pressed={viewMode === 'cards'}
                title="نمایش کارتی"
                aria-label="نمایش کارتی"
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">کارت</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('table')}
                aria-pressed={viewMode === 'table'}
                title="نمایش جدولی"
                aria-label="نمایش جدولی"
                className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Table className="w-4 h-4" />
                <span className="hidden sm:inline">جدول</span>
              </button>
            </div>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                پاک کردن فیلترها
              </button>
            )}
          </div>
        </div>
      </div>

      {/* لیست شناگران */}
      {filteredSwimmers.length > 0 ? (
        viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredSwimmers.map((sw) => (
            <div
              key={sw.swimmer_id}
              className="text-right bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
            >
              <div>
                <div
                  onClick={() => navigate(`/coach/progress/${sw.swimmer_id}`)}
                  className="flex items-center gap-3 cursor-pointer group/card-header"
                  title={`مشاهده پرونده و پروفایل ${sw.full_name}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/coach/progress/${sw.swimmer_id}`);
                    }
                  }}
                >
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-xs overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800 group-hover/card-header:ring-emerald-400 transition-all">
                    {sw.avatar ? (
                      <img
                        src={sw.avatar}
                        alt={sw.full_name}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      sw.full_name?.charAt(0) || 'ش'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-[15px] font-black text-slate-900 dark:text-white truncate group-hover/card-header:text-emerald-600 dark:group-hover/card-header:text-emerald-400 transition-colors flex items-center gap-1.5">
                      <span>{sw.full_name}</span>
                      <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover/card-header:opacity-100 transition-all -translate-x-1 group-hover/card-header:translate-x-0 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                      {sw.displayEnrollments.length} دوره ثبت‌نامی
                      {sw.phone && <span className="font-mono text-slate-400 dark:text-slate-500 mr-2">· {sw.phone}</span>}
                    </div>
                  </div>
                </div>

                {/* چیپ دوره‌ها */}
                <div className="flex flex-wrap gap-1.5 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                  {sw.displayEnrollments.slice(0, 2).map((en) => (
                    <span
                      key={en.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 text-[11px] font-bold max-w-full"
                      title={en.course_name}
                    >
                      <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{en.course_name}</span>
                    </span>
                  ))}
                  {sw.displayEnrollments.length > 2 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700 text-[11px] font-bold">
                      +{sw.displayEnrollments.length - 2} دوره دیگر
                    </span>
                  )}
                </div>
              </div>

              {/* دکمه‌های تفکیک‌شده: ثبت رکورد و فیلم شناگر */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSelectSwimmer(sw, 'record')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-[13px] font-black shadow-xs transition-all active:scale-95 cursor-pointer"
                  title={`ثبت رکورد زمانی برای ${sw.full_name}`}
                >
                  <OlympicStopwatchIcon className="w-4 h-4 shrink-0" />
                  <span>ثبت رکورد</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSwimmer(sw, 'video')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs sm:text-[13px] font-black shadow-xs transition-all active:scale-95 cursor-pointer"
                  title={`آپلود و مشاهده فیلم‌های شناگر ${sw.full_name}`}
                >
                  <Film className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <span>فیلم شناگر</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        ) : (
          /* نمای جدولی */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 font-bold text-xs lg:text-sm">
                  <tr>
                    <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">نام شناگر</th>
                    <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">دوره‌ها</th>
                    <th className="py-3.5 px-3 lg:px-4 whitespace-nowrap">استخر</th>
                    <th className="py-3.5 px-3 lg:px-4 text-center whitespace-nowrap">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSwimmers.map((sw) => {
                    const pools = Array.from(
                      new Set(sw.displayEnrollments.map((en) => (en.pool || '').trim()).filter(Boolean))
                    );
                    return (
                      <tr
                        key={sw.swimmer_id}
                        onClick={() => navigate(`/coach/progress/${sw.swimmer_id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/coach/progress/${sw.swimmer_id}`);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        title={`مشاهده پرونده و پروفایل ${sw.full_name}`}
                        className="cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-slate-800/60 transition-colors group focus:outline-none focus:bg-emerald-50/70 dark:focus:bg-slate-800/80"
                      >
                        {/* نام شناگر */}
                        <td className="py-3.5 px-3 lg:px-4 align-middle">
                          <div className="flex items-center gap-2.5 lg:gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-emerald-400 transition-all">
                              {sw.avatar ? (
                                <img
                                  src={sw.avatar}
                                  alt={sw.full_name}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                sw.full_name?.charAt(0) || 'ش'
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm lg:text-[15px] font-black text-slate-900 dark:text-white whitespace-nowrap group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                <span>{sw.full_name}</span>
                                <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              </div>
                              {sw.phone && (
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                  {sw.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* دوره‌ها */}
                        <td className="py-3.5 px-3 lg:px-4 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {sw.displayEnrollments.slice(0, 2).map((en) => (
                              <span
                                key={en.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 text-[11px] font-bold max-w-[180px]"
                                title={en.course_name}
                              >
                                <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">{en.course_name}</span>
                              </span>
                            ))}
                            {sw.displayEnrollments.length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700 text-[11px] font-bold whitespace-nowrap">
                                +{sw.displayEnrollments.length - 2} دوره دیگر
                              </span>
                            )}
                          </div>
                        </td>

                        {/* استخر */}
                        <td className="py-3.5 px-3 lg:px-4 align-middle">
                          {pools.length > 0 ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                              <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span className="truncate max-w-[190px]">{pools.join('، ')}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>

                        {/* عملیات تفکیک‌شده: ثبت رکورد و فیلم */}
                        <td
                          className="py-3.5 px-3 lg:px-4 text-center align-middle whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSwimmer(sw, 'record');
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 min-h-[36px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                              title={`ثبت رکورد برای ${sw.full_name}`}
                            >
                              <OlympicStopwatchIcon className="w-4 h-4 shrink-0" />
                              <span>ثبت رکورد</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSwimmer(sw, 'video');
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 min-h-[36px] rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                              title={`فیلم‌های شناگر ${sw.full_name}`}
                            >
                              <Film className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                              <span>فیلم شناگر</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <EmptyState
          title="شناگری یافت نشد"
          description="با تغییر فیلترهای دوره، استخر یا عبارت جست‌وجو دوباره تلاش کنید."
        />
      )}
    </div>
  );

  // ═══════════════════ مرحله ۱: انتخاب نوع شنا ═══════════════════
  const renderStrokeStep = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-5 sm:mb-7">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white">
          مرحله ۱: نوع شنا را انتخاب کنید
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          روی یکی از ماده‌های چهارگانه شنا کلیک کنید تا به مرحله مسافت بروید
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STROKES.map((s) => {
          const isSelected = stroke === s.value;
          const ac = accentClasses[s.accent];
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                setStroke(s.value);
                setWizardStep(1);
              }}
              aria-pressed={isSelected}
              className={`group flex flex-col items-center text-center gap-3 p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer focus:outline-none active:scale-[0.97] ${
                isSelected
                  ? ac.selected
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 hover:-translate-y-0.5'
              }`}
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${
                  isSelected ? ac.selectedIcon : ac.icon
                }`}
              >
                <s.Icon className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>
              <div className="min-w-0">
                <div className={`text-sm sm:text-base font-black ${isSelected ? ac.selectedText : 'text-slate-800 dark:text-slate-100'}`}>
                  {s.label}
                </div>
                <div className="hidden sm:block text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {s.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ═══════════════════ مرحله ۲: انتخاب مسافت ═══════════════════
  const renderDistanceStep = () => {
    const selectedStroke = STROKES.find((s) => s.value === stroke);
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-5 sm:mb-7">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white">
            مرحله ۲: مسافت را انتخاب کنید
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-center gap-1.5 flex-wrap">
            <span>ماده انتخاب‌شده:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 font-black text-xs">
              <selectedStroke.Icon className="w-3.5 h-3.5" />
              {selectedStroke?.fullLabel}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {DISTANCES.map((d, idx) => {
            const isSelected = distance === d.value;
            const teal = accentClasses.teal;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => {
                  setDistance(d.value);
                  resetTimer();
                  setWizardStep(2);
                }}
                aria-pressed={isSelected}
                className={`group flex flex-col items-center text-center gap-2 p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer focus:outline-none active:scale-[0.97] ${
                  isSelected
                    ? teal.selected
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 hover:-translate-y-0.5'
                }`}
              >
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isSelected ? teal.selectedIcon : teal.icon
                  }`}
                >
                  <MoveRight className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
                </div>
                <div className={`text-base sm:text-lg font-black ${isSelected ? teal.selectedText : 'text-slate-800 dark:text-slate-100'}`}>
                  {d.label}
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {d.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* دکمه بازگشت به مرحله ۱ (نوع شنا) */}
        <div className="flex items-center justify-start pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setWizardStep(0)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span>مرحله قبل: تغییر نوع شنا</span>
          </button>
        </div>
      </div>
    );
  };

  // ═══════════════════ مرحله ۳: زمان‌سنج و ثبت (کرنومتر یا دستی) ═══════════════════
  const renderTimerStep = () => {
    const selectedStroke = STROKES.find((s) => s.value === stroke);
    const selectedDistance = DISTANCES.find((d) => d.value === distance);
    const isRunning = timerState === 'running';
    const isStopped = timerState === 'stopped';
    const isManual = recordMode === 'manual';
    const parsedManual = parseRecordTime(manualTime);

    const statusPill = isManual
      ? (parsedManual
          ? { text: `زمان آماده ثبت: ${parsedManual.displayFa}`, cls: 'bg-emerald-600 text-white border-emerald-600' }
          : { text: 'ورود دستی زمان (xx:xx)', cls: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800' })
      : isRunning
      ? { text: 'در حال زمان‌گیری...', cls: 'bg-emerald-600 text-white border-emerald-600' }
      : isStopped
      ? { text: 'زمان ثبت شد — آماده ذخیره', cls: 'bg-amber-500 text-slate-950 border-amber-500' }
      : { text: 'آماده به شروع زمان‌سنج', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' };

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-5 sm:gap-6">
          {/* هدر مرحله */}
          <div className="text-center">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white">
              {isManual ? 'مرحله ۳: ورود دستی زمان رکورد' : 'مرحله ۳: استارت و ثبت زمان'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {isManual
                ? 'زمان شنا را با فرمت xx:xx وارد کنید یا در صورت نیاز به کرنومتر زنده تغییر دهید'
                : 'دکمه استارت را در لحظه ورود شناگر به آب بزنید و هنگام پایان، استاپ را فشار دهید'}
            </p>
          </div>

          {/* خلاصه انتخاب‌ها */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 text-xs sm:text-sm font-black">
              <selectedStroke.Icon className="w-4 h-4" />
              {selectedStroke?.fullLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800 text-xs sm:text-sm font-black">
              <Flag className="w-4 h-4" />
              {selectedDistance?.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-black transition-colors duration-300 ${statusPill.cls}`}>
              {isRunning && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              {statusPill.text}
            </span>
          </div>

          {/* سوییچ حالت: زمان‌سنج (کرنومتر) یا ثبت دستی */}
          <div className="flex items-center justify-center w-full pt-1">
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <button
                type="button"
                onClick={() => handleSetRecordMode('stopwatch')}
                aria-pressed={!isManual}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  !isManual
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <OlympicStopwatchIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                <span>زمان‌سنج (کرنومتر)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (timerState === 'running') clearTimerInterval();
                  handleSetRecordMode('manual');
                }}
                aria-pressed={isManual}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  isManual
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                <span>ثبت دستی (xx:xx)</span>
              </button>
            </div>
          </div>

          {/* ══════════ حالت ثبت دستی ══════════ */}
          {isManual ? (
            <div className="w-full max-w-lg mx-auto space-y-5 animate-slide-in-right">
              {/* کادر نمایشگر بزرگ زمان واردشده */}
              <div
                className={`relative w-full rounded-3xl border py-7 sm:py-9 px-4 text-center transition-colors duration-300 ${
                  parsedManual
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300/70 dark:border-emerald-800'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-center mb-2.5">
                  <div
                    className={`p-2.5 rounded-2xl transition-colors duration-300 ${
                      parsedManual
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    <Edit3 className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                </div>
                <div
                  className={`font-mono font-black tabular-nums tracking-wider leading-none select-none transition-colors duration-300 text-5xl sm:text-6xl ${
                    parsedManual
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  dir="ltr"
                >
                  {parsedManual ? parsedManual.formatted : (manualTime || 'xx:xx')}
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mt-2.5">
                  {parsedManual ? parsedManual.displayFa : 'دقیقه : ثانیه (یا صدم ثانیه)'}
                </div>
              </div>

              {/* اینپوت xx:xx */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 text-right">
                  زمان رکورد شناگر را وارد کنید <span className="text-emerald-600 font-mono font-black">(xx:xx)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={manualTime}
                    onChange={handleManualTimeChange}
                    placeholder="xx:xx"
                    dir="ltr"
                    className="w-full min-h-[56px] text-center font-mono font-black text-2xl sm:text-3xl rounded-2xl bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-inner"
                    autoFocus
                  />
                  {manualTime && (
                    <button
                      type="button"
                      onClick={() => setManualTime('')}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="پاک کردن"
                      aria-label="پاک کردن مقدار"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-right">
                  راهنما: برای ۳۵ ثانیه وارد کنید <span className="font-mono font-bold text-slate-700 dark:text-slate-300">00:35</span> یا برای ۱ دقیقه و ۱۵ ثانیه وارد کنید <span className="font-mono font-bold text-slate-700 dark:text-slate-300">01:15</span> (امکان ثبت صدم‌ثانیه مانند <span className="font-mono font-bold text-slate-700 dark:text-slate-300">00:28.45</span> نیز فراهم است).
                </p>
              </div>

              {/* بازخورد زنده اعتبارسنجی */}
              {parsedManual && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="text-xs sm:text-sm font-bold">
                    زمان محاسبه‌شده: <span className="font-mono text-base font-black underline">{parsedManual.displayFa}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs mr-2 font-mono font-normal">
                      ({parsedManual.totalSeconds.toFixed(2)} ثانیه)
                    </span>
                  </div>
                </div>
              )}

              {/* پیشنهادهای سریع */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-bold ml-1">پیشنهاد سریع:</span>
                {['00:25', '00:30', '00:35', '00:45', '01:00', '01:15', '01:30'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setManualTime(preset)}
                    className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* دکمه‌های عملیات ثبت دستی */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2">
                <Button
                  variant="success"
                  size="lg"
                  loading={saving}
                  onClick={handleSaveRecord}
                  disabled={!parsedManual || parsedManual.totalSeconds <= 0}
                  className="min-h-[52px] text-base font-black"
                  aria-label="ثبت رکورد شناگر"
                >
                  {!saving && <Save className="w-5 h-5" />}
                  ثبت رکورد دستی
                </Button>
                <button
                  type="button"
                  onClick={() => setManualTime('')}
                  disabled={!manualTime}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[52px] px-3 py-2.5 text-sm font-black rounded-xl whitespace-nowrap transition-all active:scale-95 cursor-pointer text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-4.5 h-4.5" />
                  پاک کردن ورودی
                </button>
              </div>
            </div>
          ) : (
            /* ══════════ حالت زمان‌سنج (کرنومتر) ══════════ */
            <>
              {/* نمایشگر زمان */}
              <div
                className={`relative w-full rounded-3xl border py-8 sm:py-12 px-4 text-center transition-colors duration-500 ${
                  isRunning
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300/70 dark:border-emerald-800'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-700'
                }`}
                role="timer"
                aria-live="off"
                aria-label="زمان‌سنج شنا"
              >
                {/* هاله پالس در حالت اجرا */}
                {isRunning && (
                  <div className="absolute inset-3 rounded-2xl bg-emerald-500/5 animate-pulse pointer-events-none" />
                )}
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div
                    className={`p-2.5 sm:p-3 rounded-2xl transition-colors duration-300 ${
                      isRunning
                        ? 'bg-emerald-600 text-white'
                        : isStopped
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    <OlympicStopwatchIcon className="w-7 h-7 sm:w-9 sm:h-9" />
                  </div>
                </div>
                <div
                  className={`font-mono font-black tabular-nums tracking-tight leading-none select-none transition-colors duration-300 text-5xl sm:text-6xl lg:text-7xl ${
                    isRunning
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : isStopped
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  dir="ltr"
                >
                  {formatStopwatch(elapsedMs)}
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 mt-2.5">
                  دقیقه : ثانیه : صدم ثانیه
                </div>
              </div>

              {/* کنترل‌های زمان‌سنج */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {timerState === 'idle' && (
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleStart}
                    className="min-h-[52px] col-span-1 sm:col-span-2 text-base font-black"
                    aria-label="استارت زمان‌سنج"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    استارت
                  </Button>
                )}

                {isRunning && (
                  <>
                    <Button
                      variant="danger"
                      size="lg"
                      onClick={handleStop}
                      className="min-h-[52px] text-base font-black"
                      aria-label="توقف زمان‌سنج"
                    >
                      <Square className="w-4.5 h-4.5 fill-current" />
                      استاپ
                    </Button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      aria-label="قطع زمان‌گیری"
                      className="inline-flex items-center justify-center gap-2 min-h-[52px] px-5 py-2.5 text-base font-black rounded-xl whitespace-nowrap transition-all active:scale-95 cursor-pointer text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                    >
                      <X className="w-5 h-5" />
                      قطع کردن
                    </button>
                  </>
                )}

                {isStopped && (
                  <>
                    <Button
                      variant="success"
                      size="lg"
                      loading={saving}
                      onClick={handleSaveRecord}
                      disabled={elapsedMs <= 0}
                      className="min-h-[52px] text-base font-black"
                      aria-label="ثبت رکورد شناگر"
                    >
                      {!saving && <Save className="w-5 h-5" />}
                      ثبت رکورد
                    </Button>
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={resetTimer}
                        aria-label="تلاش مجدد"
                        title="صفر کردن زمان‌سنج و شروع مجدد"
                        className="inline-flex items-center justify-center gap-1.5 min-h-[52px] px-3 py-2.5 text-sm font-black rounded-xl whitespace-nowrap transition-all active:scale-95 cursor-pointer text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <RotateCcw className="w-4.5 h-4.5" />
                        تلاش مجدد
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        aria-label="قطع زمان‌گیری"
                        className="inline-flex items-center justify-center gap-1.5 min-h-[52px] px-3 py-2.5 text-sm font-black rounded-xl whitespace-nowrap transition-all active:scale-95 cursor-pointer text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                      >
                        <X className="w-4.5 h-4.5" />
                        قطع کردن
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* راهنما */}
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed max-w-md">
            پس از ثبت، رکورد به‌صورت رسمی و تأییدشده به بخش «رکوردهای شنا» در پروفایل شناگر منتقل می‌شود.
          </p>

          {/* بازگشت به مرحله ۲ (تغییر مسافت) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 w-full flex justify-center">
            <button
              type="button"
              onClick={() => {
                if (timerState === 'running') clearTimerInterval();
                setWizardStep(1);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span>مرحله قبل: تغییر مسافت</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── رندر کلی صفحه ──
  if (loading) {
    return <LoadingState type="table" message="در حال بارگذاری فهرست شناگران..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 pb-16 sm:pb-8 coach-panel">
      {/* هدر صفحه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {selectedSwimmer && (
            <BackButton
              onClick={activeTab === 'video' ? handleBackToSwimmers : handleBackStep}
              label={activeTab === 'video' || wizardStep === 0 ? 'لیست شناگران' : 'مرحله قبل'}
              showLabelAlways
            />
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 sm:gap-2.5">
              <OlympicStopwatchIcon className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>ثبت رکورد شنا</span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              انتخاب شاگرد، زمان‌گیری دقیق با زمان‌سنج و درج رکورد در پروفایل شناگر
            </p>
          </div>
        </div>
        {!selectedSwimmer && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 text-xs font-bold shrink-0">
            <Users className="w-4 h-4 shrink-0" />
            <span>{swimmers.length} شناگر تحت مربی‌گری شما</span>
          </div>
        )}
      </div>

      {!selectedSwimmer ? (
        renderSwimmerSelect()
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {/* سوییچ بخش‌ها: ثبت رکورد زمانی / آپلود فیلم */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('record')}
              aria-pressed={activeTab === 'record'}
              className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 min-h-[46px] rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'record'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <OlympicStopwatchIcon className="w-4.5 h-4.5 shrink-0" />
              <span>ثبت رکورد زمانی</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              aria-pressed={activeTab === 'video'}
              className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 min-h-[46px] rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Video className="w-4.5 h-4.5 shrink-0" />
              <span>آپلود فیلم شناگر</span>
            </button>
          </div>

          {activeTab === 'video' ? (
            <div key="video" className="space-y-4 sm:space-y-5 animate-slide-in-right">
              {/* هدر مشخصات شناگر در بخش فیلم */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800">
                    {selectedSwimmer?.avatar ? (
                      <img
                        src={selectedSwimmer.avatar}
                        alt={selectedSwimmer.full_name}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (selectedSwimmer?.full_name || 'ش').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                      {selectedSwimmer?.full_name}
                    </div>
                    <div className="text-xs text-sky-600 dark:text-sky-400 font-bold mt-0.5 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5" />
                      <span>مدیریت و آپلود فیلم‌های شناگر</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBackToSwimmers}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                  title="بازگشت به فهرست شناگران"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>تغییر شناگر</span>
                </button>
              </div>

              {renderVideoSection()}
            </div>
          ) : (
            <>
              {renderStepper()}
              <div key={wizardStep} className="animate-slide-in-right">
                {wizardStep === 0 && renderStrokeStep()}
                {wizardStep === 1 && renderDistanceStep()}
                {wizardStep === 2 && renderTimerStep()}
              </div>
            </>
          )}

          {/* دکمه بازگشت موبایل */}
          <button
            type="button"
            onClick={activeTab === 'video' ? handleBackToSwimmers : handleBackStep}
            className="sm:hidden w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-sm font-bold transition-all active:scale-95 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            {activeTab === 'video' || wizardStep === 0 ? 'بازگشت به لیست شناگران' : 'بازگشت به مرحله قبل'}
          </button>
        </div>
      )}
    </div>
  );
};
