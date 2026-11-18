import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Trophy, Video, MessageSquare,
  Sparkles, Calendar, User, ChevronLeft,
  AlertCircle, ArrowDownRight, Maximize2,
  Crown, RefreshCw, Star, Layers,
  Compass, Eye
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { LoadingState } from '../common/LoadingState';
import { toShamsiDate } from '../../utils/date';
import { getMediaUrl } from '../../utils/media';
import {
  SwimmerCrawlIcon,
  SwimmerButterflyIcon,
  SwimmerBreaststrokeIcon,
  SwimmerBackstrokeIcon,
  WaterMedalTrophyIcon,
  OlympicStopwatchIcon,
} from '../common/AquaticIcons';

// Stroke Labels & Styling Configuration
const STROKE_CONFIG = {
  FREESTYLE: {
    label: 'کرال سینه (آزاد)',
    shortLabel: 'کرال سینه',
    Icon: SwimmerCrawlIcon,
    color: 'sky',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    chartStroke: '#0284c7',
    chartGradient: '#38bdf8',
  },
  BACKSTROKE: {
    label: 'کرال پشت',
    shortLabel: 'کرال پشت',
    Icon: SwimmerBackstrokeIcon,
    color: 'indigo',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    chartStroke: '#6366f1',
    chartGradient: '#818cf8',
  },
  BREASTSTROKE: {
    label: 'شنای قورباغه',
    shortLabel: 'قورباغه',
    Icon: SwimmerBreaststrokeIcon,
    color: 'emerald',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    chartStroke: '#059669',
    chartGradient: '#34d399',
  },
  BUTTERFLY: {
    label: 'شنای پروانه',
    shortLabel: 'پروانه',
    Icon: SwimmerButterflyIcon,
    color: 'amber',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    chartStroke: '#d97706',
    chartGradient: '#fbbf24',
  },
  MEDLEY: {
    label: 'مختلط انفرادی',
    shortLabel: 'مختلط',
    Icon: OlympicStopwatchIcon,
    color: 'purple',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    chartStroke: '#9333ea',
    chartGradient: '#c084fc',
  },
};

// Video Category Badges
const VIDEO_CATEGORIES = {
  TECHNIQUE: { label: 'تحلیل تکنیک', color: 'sky' },
  TRAINING: { label: 'تمرینی', color: 'emerald' },
  COMPETITION: { label: 'مسابقه', color: 'amber' },
  OTHER: { label: 'سایر', color: 'slate' },
};

export const SwimmerPerformanceSection = ({ swimmerId, swimmerName = '' }) => {
  // Navigation within Performance Tab: 'OVERVIEW' | 'PROGRESS_CHART' | 'BADGES' | 'COMMENTS' | 'VIDEOS'
  const [activeSubTab, setActiveSubTab] = useState('OVERVIEW');

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Performance Data Stores
  const [records, setRecords] = useState([]);
  const [leagueBadgesData, setLeagueBadgesData] = useState({
    summary: { gold_medals: 0, silver_medals: 0, bronze_medals: 0, total_medals: 0, total_points: 0, competitions_count: 0 },
    medals: [],
    honor_badges: [],
    leagues: [],
  });
  const [skillAssessments, setSkillAssessments] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [videos, setVideos] = useState([]);

  // Chart Filters
  const [chartStroke, setChartStroke] = useState('ALL');
  const [chartDistance, setChartDistance] = useState('ALL');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Comments Filters
  const [commentSourceFilter, setCommentSourceFilter] = useState('ALL'); // 'ALL' | 'COACH' | 'MANAGEMENT'

  // Video Filter & Modal Player
  const [videoCategoryFilter, setVideoCategoryFilter] = useState('ALL');
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Fetch all performance data for this swimmer
  const fetchPerformanceData = useCallback(async (isRefresh = false) => {
    if (!swimmerId) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError('');

      const params = { swimmer_id: swimmerId };

      const [recordsRes, badgesRes, skillsRes, promotionsRes, videosRes] = await Promise.allSettled([
        api.get('/assessments/records/', { params }),
        api.get('/leagues/swimmer-badges/', { params }),
        api.get('/assessments/skills/', { params }),
        api.get('/assessments/promotions/', { params }),
        api.get('/swimmers/videos/', { params }),
      ]);

      // 1. Records
      if (recordsRes.status === 'fulfilled') {
        const d = recordsRes.value.data;
        setRecords(Array.isArray(d) ? d : d.results || []);
      }

      // 2. League Badges & Medals
      if (badgesRes.status === 'fulfilled') {
        setLeagueBadgesData(badgesRes.value.data || {
          summary: { gold_medals: 0, silver_medals: 0, bronze_medals: 0, total_medals: 0, total_points: 0, competitions_count: 0 },
          medals: [],
          honor_badges: [],
          leagues: [],
        });
      }

      // 3. Skill Assessments (Coach feedback)
      if (skillsRes.status === 'fulfilled') {
        const d = skillsRes.value.data;
        setSkillAssessments(Array.isArray(d) ? d : d.results || []);
      }

      // 4. Promotions (Coach & Management review notes)
      if (promotionsRes.status === 'fulfilled') {
        const d = promotionsRes.value.data;
        setPromotions(Array.isArray(d) ? d : d.results || []);
      }

      // 5. Swim Videos (Uploaded by coach)
      if (videosRes.status === 'fulfilled') {
        const d = videosRes.value.data;
        setVideos(Array.isArray(d) ? d : d.results || []);
      }
    } catch (err) {
      console.error('Error loading performance data:', err);
      setLoadError('خطا در دریافت جامع اطلاعات عملکردی شناگر');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [swimmerId]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Available distances from records
  const availableDistances = useMemo(() => {
    const set = new Set(records.map((r) => r.distance_meters).filter(Boolean));
    return Array.from(set).sort((a, b) => a - b);
  }, [records]);

  // Filtered Records for Chart & Table
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (chartStroke !== 'ALL' && r.stroke !== chartStroke) return false;
      if (chartDistance !== 'ALL' && Number(r.distance_meters) !== Number(chartDistance)) return false;
      return true;
    });
  }, [records, chartStroke, chartDistance]);

  // Chronologically sorted records for trend calculation
  const chronologicalRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  }, [filteredRecords]);

  // Personal Best (PB) record for selected stroke / overall
  const personalBest = useMemo(() => {
    if (chronologicalRecords.length === 0) return null;
    return [...chronologicalRecords].sort((a, b) => Number(a.duration_seconds || 9999) - Number(b.duration_seconds || 9999))[0];
  }, [chronologicalRecords]);

  // Latest Record
  const latestRecord = useMemo(() => {
    if (chronologicalRecords.length === 0) return null;
    return chronologicalRecords[chronologicalRecords.length - 1];
  }, [chronologicalRecords]);

  // Progression metrics (First recorded time vs Latest recorded time)
  const progressionMetrics = useMemo(() => {
    if (chronologicalRecords.length < 2) return null;
    const first = chronologicalRecords[0];
    const latest = chronologicalRecords[chronologicalRecords.length - 1];
    const diff = Number(latest.duration_seconds) - Number(first.duration_seconds);
    const isImprovement = diff <= 0; // lower duration means faster swimming!
    const percent = Math.abs((diff / Number(first.duration_seconds)) * 100).toFixed(1);

    return {
      isImprovement,
      diffSeconds: Math.abs(diff).toFixed(2),
      percent,
      firstTime: first.formatted_time || `${first.duration_seconds}s`,
      latestTime: latest.formatted_time || `${latest.duration_seconds}s`,
    };
  }, [chronologicalRecords]);

  // SVG Chart Dimensions & Coordinate points
  const chartPoints = useMemo(() => {
    if (chronologicalRecords.length < 2) return null;

    const values = chronologicalRecords.map((r) => Number(r.duration_seconds));
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 260;
    const paddingX = 50;
    const paddingY = 40;

    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingY * 2;

    const stepX = innerWidth / (chronologicalRecords.length - 1);

    const points = chronologicalRecords.map((r, idx) => {
      const val = Number(r.duration_seconds);
      // Invert Y axis: faster (lower value) is higher on the chart!
      const normalizedY = (val - minVal) / range;
      const x = paddingX + idx * stepX;
      const y = paddingY + normalizedY * innerHeight;

      const shamsi = toShamsiDate(r.recorded_at)?.shortNumeric || r.recorded_at;

      return {
        x,
        y,
        value: val,
        formattedTime: r.formatted_time || `${val.toFixed(2)}s`,
        date: shamsi,
        stroke: r.stroke,
        strokeLabel: STROKE_CONFIG[r.stroke]?.label || r.stroke_display || r.stroke,
        distance: r.distance_meters,
        recordedBy: r.recorded_by_name || 'مربی آکادمی',
        notes: r.notes,
        isVerified: r.verification_status === 'VERIFIED',
      };
    });

    // Build smooth cubic bezier SVG path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // Build area fill path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY + 20} L ${points[0].x} ${height - paddingY + 20} Z`;

    return {
      points,
      pathD,
      areaD,
      minVal,
      maxVal,
      width,
      height,
      paddingX,
      paddingY,
    };
  }, [chronologicalRecords]);

  // Aggregated Comments List (from Assessments feedback, Promotion coach notes & reviewer notes, and Record notes)
  const aggregatedComments = useMemo(() => {
    const list = [];

    // 1. Skill Assessments (Coach technical feedback)
    skillAssessments.forEach((ass) => {
      if (ass.feedback && ass.feedback.trim()) {
        const dateObj = toShamsiDate(ass.assessed_at || ass.created_at);
        list.push({
          id: `assessment-${ass.id}`,
          type: 'COACH',
          sourceTitle: 'ارزیابی مهارت فنی',
          skillName: ass.skill_name || 'سرفصل مهارتی',
          authorName: ass.assessed_by_name || 'مربی ارزیاب',
          date: dateObj.shortNumeric,
          dateFull: dateObj.fullText,
          content: ass.feedback.trim(),
          score: ass.score !== undefined && ass.score !== null ? Math.round(ass.score) : null,
          status: ass.status,
          statusDisplay: ass.status_display || (ass.status === 'PASSED' ? 'قبول' : 'در حال تمرین'),
        });
      }
    });

    // 2. Promotion Proposals: Coach notes & Reviewer (Management) notes
    promotions.forEach((p) => {
      const dateObj = toShamsiDate(p.created_at);
      const reviewDateObj = p.reviewed_at ? toShamsiDate(p.reviewed_at) : null;

      // Coach Note
      if (p.coach_notes && p.coach_notes.trim()) {
        list.push({
          id: `promo-coach-${p.id}`,
          type: 'COACH',
          sourceTitle: 'پیشنهاد ارتقای سطح مهارتی',
          targetLevel: p.proposed_level_name || 'سطح بالاتر',
          authorName: p.coach_name || 'مربی آموزشی',
          date: dateObj.shortNumeric,
          dateFull: dateObj.fullText,
          content: p.coach_notes.trim(),
          status: p.status,
          statusDisplay: p.status_display || 'پیشنهاد ارتقا',
        });
      }

      // Management / Reviewer Note
      if (p.reviewer_notes && p.reviewer_notes.trim()) {
        list.push({
          id: `promo-manager-${p.id}`,
          type: 'MANAGEMENT',
          sourceTitle: 'بررسی و دستور مدیریت آموزشگاه',
          targetLevel: p.proposed_level_name || 'سطح پیشنهادی',
          authorName: p.reviewed_by_name || 'مدیریت آکادمی',
          date: reviewDateObj?.shortNumeric || dateObj.shortNumeric,
          dateFull: reviewDateObj?.fullText || dateObj.fullText,
          content: p.reviewer_notes.trim(),
          status: p.status,
          statusDisplay: p.status_display || (p.status === 'APPROVED' ? 'تأییدشده' : 'بررسی‌شده'),
        });
      }
    });

    // 3. Records Notes (Coach notes on time trials)
    records.forEach((r) => {
      if (r.notes && r.notes.trim()) {
        const dateObj = toShamsiDate(r.recorded_at || r.created_at);
        list.push({
          id: `record-note-${r.id}`,
          type: 'COACH',
          sourceTitle: `تست رکوردگیری (${r.distance_meters}م ${r.stroke_display || r.stroke})`,
          authorName: r.recorded_by_name || 'مربی ثبت‌کننده رکورد',
          date: dateObj.shortNumeric,
          dateFull: dateObj.fullText,
          content: r.notes.trim(),
          formattedTime: r.formatted_time || `${r.duration_seconds}s`,
          status: r.verification_status,
          statusDisplay: r.verification_status_display || (r.verification_status === 'VERIFIED' ? 'رسمی' : 'در انتظار'),
        });
      }
    });

    // Sort comments newest first
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [skillAssessments, promotions, records]);

  // Filtered comments
  const filteredComments = useMemo(() => {
    if (commentSourceFilter === 'ALL') return aggregatedComments;
    return aggregatedComments.filter((c) => c.type === commentSourceFilter);
  }, [aggregatedComments, commentSourceFilter]);

  // Filtered videos
  const filteredVideos = useMemo(() => {
    if (videoCategoryFilter === 'ALL') return videos;
    return videos.filter((v) => v.category === videoCategoryFilter);
  }, [videos, videoCategoryFilter]);

  if (loading) {
    return (
      <div className="py-12">
        <LoadingState type="dashboard" message="در حال دریافت پرونده عملکردی، رکوردها و نشان‌های افتخار شناگر..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base sm:text-lg font-bold text-rose-900 dark:text-rose-200">{loadError}</h3>
        <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 max-w-md mx-auto">
          ارتباط با سرور جهت واکشی پرونده عملکردی شناگر برقرار نشد. لطفاً مجدداً تلاش فرمایید.
        </p>
        <Button variant="secondary" onClick={() => fetchPerformanceData(true)} className="gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" />
          <span>تلاش مجدد</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* =================================================================== */}
      {/* 1. HERO HEADER: Swimmer Performance Overview & Sub-Nav Pills        */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 text-white p-5 sm:p-7 shadow-lg border border-sky-900/50">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>پرونده عملکرد و پیشرفت تخصصی شناگر</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                <span>عملکرد و افتخارات ورزشی</span>
                {swimmerName && <span className="text-sky-300 font-bold text-lg sm:text-xl">({swimmerName})</span>}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                رصد هوشمند رکوردهای زمانی ثبت‌شده توسط مربی، نشان‌ها و افتخارات لیگ، بازخوردهای تخصصی کادر مربیگری و ویدئوهای تحلیل تکنیک
              </p>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchPerformanceData(true)}
                disabled={refreshing}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md text-xs gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>بروزرسانی دیتا</span>
              </Button>
            </div>
          </div>

          {/* Sub-Navigation Pills (Touch-first, responsive, zero-overflow) */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 border-t border-white/10 pt-4 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveSubTab('OVERVIEW')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'OVERVIEW'
                  ? 'bg-white text-slate-900 shadow-md font-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>نمای کلی عملکرد</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('PROGRESS_CHART')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 relative ${
                activeSubTab === 'PROGRESS_CHART'
                  ? 'bg-sky-500 text-white shadow-md font-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>نمودار پیشرفت و رکوردها</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
                {records.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('BADGES')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 relative ${
                activeSubTab === 'BADGES'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>نشان‌های دریافتی از لیگ</span>
              {leagueBadgesData.summary.total_medals > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-400 text-slate-950 font-black">
                  {leagueBadgesData.summary.total_medals}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('COMMENTS')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 relative ${
                activeSubTab === 'COMMENTS'
                  ? 'bg-emerald-500 text-white shadow-md font-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>کامنت مربی و مدیریت</span>
              {aggregatedComments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
                  {aggregatedComments.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('VIDEOS')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 relative ${
                activeSubTab === 'VIDEOS'
                  ? 'bg-purple-600 text-white shadow-md font-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>فیلم شنای شناگر</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
                {videos.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. SUB-TAB 1: OVERVIEW DASHBOARD                                    */}
      {/* =================================================================== */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
          {/* Quick Metrics Bar (4 KPI Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: Records Count & PB */}
            <div
              onClick={() => setActiveSubTab('PROGRESS_CHART')}
              className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-400 dark:hover:border-sky-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">رکوردهای ثبت‌شده مربی</span>
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{records.length}</span>
                <span className="text-xs text-slate-400">رکورد ثبت‌شده</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-sky-600 dark:text-sky-400 font-medium flex items-center justify-between">
                <span>بهترین: {personalBest ? personalBest.formatted_time || `${personalBest.duration_seconds}s` : '—'} {latestRecord ? `• آخرین: ${latestRecord.formatted_time || `${latestRecord.duration_seconds}s`}` : ''}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* KPI 2: League Badges & Medals */}
            <div
              onClick={() => setActiveSubTab('BADGES')}
              className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">مدال‌ها و نشان‌های لیگ</span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">
                  {leagueBadgesData.summary.total_medals}
                </span>
                <span className="text-xs text-slate-400">مدال رسمی</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center justify-between">
                <span>
                  🥇 {leagueBadgesData.summary.gold_medals} | 🥈 {leagueBadgesData.summary.silver_medals} | 🥉 {leagueBadgesData.summary.bronze_medals}
                </span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* KPI 3: Coach & Management Feedback */}
            <div
              onClick={() => setActiveSubTab('COMMENTS')}
              className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نظرات مربی و مدیریت</span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {aggregatedComments.length}
                </span>
                <span className="text-xs text-slate-400">بازخورد و کامنت</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
                <span>مشاهده آخرین نظرات</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* KPI 4: Swimming Videos */}
            <div
              onClick={() => setActiveSubTab('VIDEOS')}
              className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-400 dark:hover:border-purple-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ویدئوهای تحلیل شنا</span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">{videos.length}</span>
                <span className="text-xs text-slate-400">ویدئوی بارگذاری‌شده</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-center justify-between">
                <span>پخش و تحلیل تکنیک</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Featured Section 1: Progress Chart Preview */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    نمودار پیشرفت زمانی رکوردها
                  </h3>
                  <p className="text-xs text-slate-500">روند کاهش تایم و سرعت شناگر در تست‌های رسمی مربی</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('PROGRESS_CHART')}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer self-end sm:self-auto"
              >
                <span>مشاهده کامل و فیلتر ماده‌ها</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Chart SVG Canvas */}
            {chartPoints ? (
              <div className="space-y-3">
                <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-950/60 dark:to-slate-900 p-2 sm:p-4 border border-slate-100 dark:border-slate-800/80">
                  <svg
                    viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
                    className="w-full h-48 sm:h-64 overflow-visible"
                  >
                    <defs>
                      <linearGradient id="overviewAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="50" y1="40" x2="750" y2="40" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                    <line x1="50" y1="130" x2="750" y2="130" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
                    <line x1="50" y1="220" x2="750" y2="220" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />

                    {/* Gradient Area Fill */}
                    <path d={chartPoints.areaD} fill="url(#overviewAreaGradient)" />

                    {/* Stroke Line */}
                    <path
                      d={chartPoints.pathD}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Points */}
                    {chartPoints.points.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="6"
                          className="fill-white dark:fill-slate-900 stroke-sky-600 dark:stroke-sky-400 stroke-[3px] transition-all hover:scale-150 cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <text
                          x={pt.x}
                          y={chartPoints.height - 10}
                          textAnchor="middle"
                          className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                        >
                          {pt.date}
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* Tooltip on Hover */}
                  {hoveredPoint && (
                    <div
                      className="absolute z-20 pointer-events-none p-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl border border-slate-700 dark:border-slate-200 text-xs space-y-1 transform -translate-x-1/2 -translate-y-full"
                      style={{
                        left: `${(hoveredPoint.x / chartPoints.width) * 100}%`,
                        top: `${(hoveredPoint.y / chartPoints.height) * 100}%`,
                      }}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{hoveredPoint.distance}م {hoveredPoint.strokeLabel}</span>
                        {hoveredPoint.isVerified && <Badge variant="success" size="sm">تأییدشده</Badge>}
                      </div>
                      <div className="text-base font-black font-mono text-sky-400 dark:text-sky-600">
                        {hoveredPoint.formattedTime}
                      </div>
                      <div className="text-[10px] text-slate-300 dark:text-slate-600">
                        {hoveredPoint.date} • {hoveredPoint.recordedBy}
                      </div>
                    </div>
                  )}
                </div>

                {progressionMetrics && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-xs">
                    <span className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                      <span>میزان رشد زمانی:</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ArrowDownRight className="w-4 h-4" />
                      <span>{progressionMetrics.diffSeconds} ثانیه کاهش زمان ({progressionMetrics.percent}٪ سریع‌تر)</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                {records.length === 1 ? 'یک رکورد ثبت شده است. با ثبت دومین رکورد توسط مربی، نمودار پیشرفت فعال می‌شود.' : 'هنوز رکوردی توسط مربی در پرونده ثبت نشده است.'}
              </div>
            )}
          </div>

          {/* Featured Section 2: Latest League Badges & Latest Coach Comment (2-Column Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Box 1: Latest Medals / League Badges */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Trophy className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">نشان‌های مسابقاتی لیگ</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('BADGES')}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>همه نشان‌ها</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {leagueBadgesData.medals.length > 0 || leagueBadgesData.honor_badges.length > 0 ? (
                <div className="space-y-2.5">
                  {leagueBadgesData.medals.slice(0, 3).map((medalItem) => (
                    <div
                      key={medalItem.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl shrink-0">
                          {medalItem.medal === 'GOLD' ? '🥇' : medalItem.medal === 'SILVER' ? '🥈' : '🥉'}
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                            {medalItem.event_name}
                          </h4>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                            {medalItem.competition_title} • {medalItem.season}
                          </span>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 block">
                          +{medalItem.score_points} امتیاز
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {medalItem.formatted_time || '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  هنوز نشانی در لیگ مسابقاتی برای این شناگر ثبت نشده است.
                </div>
              )}
            </div>

            {/* Box 2: Latest Coach & Management Comments */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">نظرات و بازخوردها</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('COMMENTS')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>مشاهده همه ({aggregatedComments.length})</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {aggregatedComments.length > 0 ? (
                <div className="space-y-3">
                  {aggregatedComments.slice(0, 2).map((comm) => (
                    <div
                      key={comm.id}
                      className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                        comm.type === 'COACH'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
                          : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold flex items-center gap-1.5 ${comm.type === 'COACH' ? 'text-emerald-800 dark:text-emerald-300' : 'text-indigo-800 dark:text-indigo-300'}`}>
                          <User className="w-3 h-3" />
                          <span>{comm.authorName}</span>
                          <span className="text-[10px] opacity-75 font-normal">({comm.sourceTitle})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{comm.date}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                        «{comm.content}»
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  هنوز یادداشت یا بازخوردی توسط مربی یا مدیریت ثبت نشده است.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. SUB-TAB 2: PROGRESS CHART & DETAILED RECORDS                     */}
      {/* =================================================================== */}
      {activeSubTab === 'PROGRESS_CHART' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
          {/* Filter Bar: Stroke & Distance Selectors */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-500" />
                  <span>تحلیل نموداری پیشرفت رکوردها</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  نمودار بر پایه رکوردهای ثبت‌شده توسط مربیان آکادمی تنظیم گردیده است
                </p>
              </div>

              {/* Stroke filter chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setChartStroke('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    chartStroke === 'ALL'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  همه ماده‌ها
                </button>
                {Object.entries(STROKE_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.Icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setChartStroke(key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        chartStroke === key
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cfg.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Distance filter chips */}
            {availableDistances.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 font-bold shrink-0">مسافت:</span>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setChartDistance('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      chartDistance === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    همه
                  </button>
                  {availableDistances.map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => setChartDistance(dist)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer font-mono ${
                        Number(chartDistance) === Number(dist)
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {dist} متر
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Chart Canvas */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            {chartPoints ? (
              <div className="space-y-4">
                <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-950/80 dark:to-slate-900 p-3 sm:p-6 border border-slate-100 dark:border-slate-800">
                  <svg
                    viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
                    className="w-full h-56 sm:h-72 lg:h-80 overflow-visible"
                  >
                    <defs>
                      <linearGradient id="mainAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal reference lines */}
                    <line x1="50" y1="40" x2="750" y2="40" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />
                    <line x1="50" y1="130" x2="750" y2="130" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />
                    <line x1="50" y1="220" x2="750" y2="220" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />

                    {/* Area fill */}
                    <path d={chartPoints.areaD} fill="url(#mainAreaGradient)" />

                    {/* Main Curve */}
                    <path
                      d={chartPoints.pathD}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Point Circles & Dates */}
                    {chartPoints.points.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="7"
                          className="fill-white dark:fill-slate-900 stroke-sky-600 dark:stroke-sky-400 stroke-[3.5px] transition-all hover:scale-150 cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <text
                          x={pt.x}
                          y={chartPoints.height - 10}
                          textAnchor="middle"
                          className="text-[11px] fill-slate-400 dark:fill-slate-500 font-mono font-medium"
                        >
                          {pt.date}
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* Hovered Point Card */}
                  {hoveredPoint && (
                    <div
                      className="absolute z-30 pointer-events-none p-3.5 rounded-2xl bg-slate-900/95 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-200 text-xs space-y-1.5 transform -translate-x-1/2 -translate-y-full"
                      style={{
                        left: `${(hoveredPoint.x / chartPoints.width) * 100}%`,
                        top: `${(hoveredPoint.y / chartPoints.height) * 100}%`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{hoveredPoint.distance}متر {hoveredPoint.strokeLabel}</span>
                        {hoveredPoint.isVerified ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 dark:text-emerald-700 text-[10px] font-black">رسمی</span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 dark:text-amber-700 text-[10px]">در انتظار</span>
                        )}
                      </div>
                      <div className="text-lg font-black font-mono text-sky-400 dark:text-sky-600">
                        {hoveredPoint.formattedTime}
                      </div>
                      <div className="text-[11px] text-slate-300 dark:text-slate-600">
                        ثبت توسط: {hoveredPoint.recordedBy} • {hoveredPoint.date}
                      </div>
                      {hoveredPoint.notes && (
                        <div className="text-[10px] italic text-slate-400 dark:text-slate-500 border-t border-white/10 dark:border-slate-200 pt-1">
                          «{hoveredPoint.notes}»
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progression Banner */}
                {progressionMetrics && (
                  <div className="p-4 rounded-2xl bg-gradient-to-l from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-sky-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                          شاخص بهبود و رشد زمانی شناگر
                        </h4>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                          تغییرات ثبت‌شده از اولین رکورد ({progressionMetrics.firstTime}) تا آخرین رکورد ({progressionMetrics.latestTime})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-emerald-700 dark:text-emerald-300 font-black text-sm sm:text-base">
                      <ArrowDownRight className="w-5 h-5 text-emerald-600 animate-bounce" />
                      <span>{progressionMetrics.diffSeconds} ثانیه ({progressionMetrics.percent}٪ پیشرفت)</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <OlympicStopwatchIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  اطلاعات کافی برای رسم نمودار این فیلتر وجود ندارد
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  حداقل دو رکورد زمانی معتبر در این ماده و مسافت لازم است تا نمودار پیوسته رسم گردد.
                </p>
              </div>
            )}
          </div>

          {/* Records Table / List */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <OlympicStopwatchIcon className="w-5 h-5 text-sky-500" />
                <span>جدول تمامی رکوردهای زمانی شناگر ({filteredRecords.length})</span>
              </h3>
            </div>

            {filteredRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                      <th className="py-3 px-3">ماده و سبک</th>
                      <th className="py-3 px-3">مسافت</th>
                      <th className="py-3 px-3">زمان ثبت‌شده</th>
                      <th className="py-3 px-3">نوع استخر</th>
                      <th className="py-3 px-3">تاریخ تست</th>
                      <th className="py-3 px-3">مربی ثبت‌کننده</th>
                      <th className="py-3 px-3">وضعیت رسمی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRecords.map((r) => {
                      const shamsi = toShamsiDate(r.recorded_at)?.shortNumeric || r.recorded_at;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                            {STROKE_CONFIG[r.stroke]?.label || r.stroke_display || r.stroke}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {r.distance_meters} متر
                          </td>
                          <td className="py-3.5 px-3 font-mono font-black text-sky-600 dark:text-sky-400 text-sm sm:text-base">
                            {r.formatted_time || `${r.duration_seconds}s`}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500 text-xs">
                            {r.pool_course === 'LONG_50M' ? 'استخر ۵۰ متر' : 'استخر ۲۵ متر'}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-500 text-xs">
                            {shamsi}
                          </td>
                          <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 text-xs">
                            {r.recorded_by_name || 'مربی آکادمی'}
                          </td>
                          <td className="py-3.5 px-3">
                            <Badge variant={r.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                              {r.verification_status_display || (r.verification_status === 'VERIFIED' ? 'تأییدشده' : 'در انتظار')}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs sm:text-sm text-slate-400">
                رکوردی منطبق با فیلترهای انتخابی یافت نشد.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. SUB-TAB 3: LEAGUE BADGES & MEDALS                                */}
      {/* =================================================================== */}
      {activeSubTab === 'BADGES' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
          {/* Top Banner: League Medals Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-300 dark:border-amber-800/80 shadow-xs text-center sm:text-right">
              <span className="text-3xl sm:text-4xl block mb-1">🥇</span>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">مدال‌های طلا</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 font-mono">
                {leagueBadgesData.summary.gold_medals}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-slate-800/50 dark:to-slate-800/20 border border-slate-300 dark:border-slate-700 shadow-xs text-center sm:text-right">
              <span className="text-3xl sm:text-4xl block mb-1">🥈</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">مدال‌های نقره</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-200 font-mono">
                {leagueBadgesData.summary.silver_medals}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-orange-50 to-amber-100/40 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-600/40 dark:border-amber-900/60 shadow-xs text-center sm:text-right">
              <span className="text-3xl sm:text-4xl block mb-1">🥉</span>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-400 block">مدال‌های برنز</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-400 font-mono">
                {leagueBadgesData.summary.bronze_medals}
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-sky-50 to-blue-100/60 dark:from-sky-950/40 dark:to-blue-900/20 border border-sky-300 dark:border-sky-800 shadow-xs text-center sm:text-right">
              <span className="text-3xl sm:text-4xl block mb-1">🏆</span>
              <span className="text-xs font-bold text-sky-800 dark:text-sky-300 block">امتیازات لیگ</span>
              <span className="text-2xl sm:text-3xl font-black text-sky-700 dark:text-sky-300 font-mono">
                {leagueBadgesData.summary.total_points}
              </span>
            </div>
          </div>

          {/* Section: Competition Medals Grid */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <WaterMedalTrophyIcon className="w-5 h-5 text-amber-500" />
                  <span>مدال‌های افتخار کسب‌شده در مسابقات رسمی</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  مدال‌ها به طور خودکار بر اساس ثبت نتایج توسط داوران و ناظران لیگ در پروفایل قرار می‌گیرند
                </p>
              </div>

              <Link
                to="/swimmer/league"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-bold text-xs transition-colors cursor-pointer self-end sm:self-auto"
              >
                <span>مشاهده جدول کامل لیگ</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            {leagueBadgesData.medals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leagueBadgesData.medals.map((m) => {
                  const isGold = m.medal === 'GOLD';
                  const isSilver = m.medal === 'SILVER';
                  const shamsi = toShamsiDate(m.recorded_at)?.fullText || m.recorded_at;

                  return (
                    <div
                      key={m.id}
                      className={`relative overflow-hidden p-5 rounded-3xl border transition-all hover:scale-[1.02] shadow-xs ${
                        isGold
                          ? 'bg-gradient-to-br from-amber-50 via-yellow-50/80 to-amber-100/60 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-amber-900/30 border-amber-300 dark:border-amber-700/80'
                          : isSilver
                          ? 'bg-gradient-to-br from-slate-50 via-slate-100/80 to-slate-200/50 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/20 border-slate-300 dark:border-slate-700'
                          : 'bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-amber-100/40 dark:from-orange-950/40 dark:via-amber-950/20 dark:to-amber-900/20 border-amber-500/40 dark:border-amber-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-xs border border-white/40 dark:border-slate-700">
                          {isGold ? '🥇' : isSilver ? '🥈' : '🥉'}
                        </div>
                        <Badge variant={isGold ? 'warning' : isSilver ? 'default' : 'secondary'}>
                          {isGold ? 'مدال طلا (مقام اول)' : isSilver ? 'مدال نقره (مقام دوم)' : 'مدال برنز (مقام سوم)'}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                          {m.event_name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {m.competition_title} • {m.league_name}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono">
                        <span className="font-black text-sky-600 dark:text-sky-400">
                          {m.formatted_time || '—'}
                        </span>
                        <span className="font-bold text-amber-700 dark:text-amber-300">
                          +{m.score_points} امتیاز لیگ
                        </span>
                      </div>

                      <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                        {shamsi}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 sm:p-10 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-center space-y-3">
                <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                  هنوز مدالی از مسابقات لیگ کسب نشده است
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  با شرکت در رویدادهای لیگ شنای باشگاه و کسب رتبه‌های اول تا سوم، مدال‌ها و نشان‌های افتخار در این بخش قرار می‌گیرند.
                </p>
                <div className="pt-2">
                  <Link
                    to="/swimmer/league"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm hover:bg-amber-400 transition-colors"
                  >
                    <span>برنامه و رده‌بندی مسابقات لیگ</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Section: Special League Honor Badges */}
          {leagueBadgesData.honor_badges.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  نشان‌های ویژه افتخار و جایگاه در لیگ
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {leagueBadgesData.honor_badges.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-gradient-to-l from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-start gap-3"
                  >
                    <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 shrink-0">
                      <Star className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{b.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. SUB-TAB 4: COACH & MANAGEMENT COMMENTS                           */}
      {/* =================================================================== */}
      {activeSubTab === 'COMMENTS' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
          {/* Header & Source Filter Pills */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                <span>کامنت‌ها، بازخوردها و نکات مربی و مدیریت</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                شامل رهنمودهای فنی مربی، نظرات ثبت‌شده در پرونده تعیین سطح و تصمیمات اداری مدیریت
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setCommentSourceFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  commentSourceFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                همه ({aggregatedComments.length})
              </button>
              <button
                type="button"
                onClick={() => setCommentSourceFilter('COACH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  commentSourceFilter === 'COACH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                کادر مربیگری
              </button>
              <button
                type="button"
                onClick={() => setCommentSourceFilter('MANAGEMENT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  commentSourceFilter === 'MANAGEMENT'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                مدیریت آکادمی
              </button>
            </div>
          </div>

          {/* Comments List */}
          {filteredComments.length > 0 ? (
            <div className="space-y-4">
              {filteredComments.map((comm) => {
                const isCoach = comm.type === 'COACH';
                return (
                  <div
                    key={comm.id}
                    className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-3 transition-all ${
                      isCoach
                        ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isCoach
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          {isCoach ? 'مربی' : 'مدیر'}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                              {comm.authorName}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCoach
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                              }`}
                            >
                              {comm.sourceTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span className="font-mono">{comm.date}</span>
                            {comm.targetLevel && (
                              <>
                                <span>•</span>
                                <span>سطح هدف: {comm.targetLevel}</span>
                              </>
                            )}
                            {comm.skillName && (
                              <>
                                <span>•</span>
                                <span>مهارت: {comm.skillName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {comm.score !== null && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                            {comm.score} / ۱۰۰
                          </span>
                        )}
                        {comm.statusDisplay && (
                          <Badge variant={comm.status === 'APPROVED' || comm.status === 'PASSED' ? 'success' : 'default'}>
                            {comm.statusDisplay}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Speech / Comment Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isCoach
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-800 dark:text-slate-200 border border-emerald-100 dark:border-emerald-900/40'
                          : 'bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-800 dark:text-slate-200 border border-indigo-100 dark:border-indigo-900/40'
                      }`}
                    >
                      <p className="font-normal whitespace-pre-line">
                        «{comm.content}»
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                هیچ کامنت یا نظری در این دسته‌بندی وجود ندارد
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                پس از برگزاری جلسات آموزشی یا ثبت گزارش توسط مربی و مدیریت، توضیحات در این قسمت نمایش داده می‌شوند.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. SUB-TAB 5: SWIMMER TECHNIQUE VIDEOS                              */}
      {/* =================================================================== */}
      {activeSubTab === 'VIDEOS' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
          {/* Header & Category Filter */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-500" />
                <span>فیلم‌های تحلیل شنای شناگر ({filteredVideos.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ویدئوهای ضبط‌شده توسط مربی جهت بررسی تکنیک دست‌وپا، تنفس و هماهنگی حرکتی
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setVideoCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  videoCategoryFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                همه دسته‌ها
              </button>
              {Object.entries(VIDEO_CATEGORIES).map(([catKey, catCfg]) => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setVideoCategoryFilter(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    videoCategoryFilter === catKey
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {catCfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Videos Grid */}
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVideos.map((vid) => {
                const vidUrl = getMediaUrl(vid.video_url || vid.video);
                const shamsi = toShamsiDate(vid.created_at)?.shortNumeric || vid.created_at;
                const catLabel = VIDEO_CATEGORIES[vid.category]?.label || vid.category_display || vid.category;

                return (
                  <div
                    key={vid.id}
                    className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col group hover:border-purple-300 dark:hover:border-purple-800 transition-all"
                  >
                    {/* Video Player Box */}
                    <div className="relative aspect-video bg-black/90 flex items-center justify-center overflow-hidden">
                      {vidUrl ? (
                        <video
                          src={vidUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-slate-400 text-xs">فایل ویدئو در دسترس نیست</div>
                      )}

                      {/* Fullscreen Modal trigger button */}
                      {vidUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveVideoModal(vid);
                            setPlaybackRate(1);
                          }}
                          className="absolute top-2.5 left-2.5 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-md"
                          title="تحلیل تمام‌صفحه با کنترل سرعت"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Meta & Description */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                            {catLabel}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{shamsi}</span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                          {vid.title || 'ویدئوی تحلیل تکنیک شناگر'}
                        </h4>

                        {vid.description ? (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {vid.description}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">بدون توضیحات تکمیلی</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>ثبت: {vid.uploaded_by_name || 'مربی شنا'}</span>
                        </span>

                        {vidUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVideoModal(vid);
                              setPlaybackRate(1);
                            }}
                            className="font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>تحلیل حرکت</span>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <Video className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                هنوز ویدئویی توسط مربی بارگذاری نشده است
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                مربیان در جلسات تمرینی یا زمان‌گیری، فیلم‌های تحلیل زاویه دست‌وپا و استارت را ثبت می‌کنند و به صورت خودکار در این بخش به نمایش درمی‌آید.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 7. FULLSCREEN MODAL FOR TECHNICAL VIDEO ANALYSIS                    */}
      {/* =================================================================== */}
      {activeVideoModal && (
        <Modal
          isOpen={Boolean(activeVideoModal)}
          onClose={() => setActiveVideoModal(null)}
          title={activeVideoModal.title || 'تحلیل فنی ویدئوی شنا'}
          size="xl"
        >
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <video
                key={activeVideoModal.id}
                src={getMediaUrl(activeVideoModal.video_url || activeVideoModal.video)}
                controls
                autoPlay
                playsInline
                ref={(ref) => {
                  if (ref) ref.playbackRate = playbackRate;
                }}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Playback speed controls (Crucial for swimming technique analysis!) */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-600" />
                <span>سرعت پخش جهت تحلیل دقیق حرکات:</span>
              </span>

              <div className="flex items-center gap-1.5 font-mono">
                {[0.25, 0.5, 0.75, 1, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPlaybackRate(rate)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-50'
                    }`}
                  >
                    {rate}x {rate < 1 ? '(آهسته)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes & Description in Modal */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>بارگذاری توسط: {activeVideoModal.uploaded_by_name || 'کادر فنی مربیگری'}</span>
                <span>تاریخ: {toShamsiDate(activeVideoModal.created_at)?.fullText || activeVideoModal.created_at}</span>
              </div>
              {activeVideoModal.description && (
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  {activeVideoModal.description}
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
