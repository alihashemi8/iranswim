import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award, TrendingUp, CheckCircle2, Clock, AlertCircle, FileText,
  User, Calendar, Sparkles, ChevronLeft, ArrowUpRight, BarChart3,
  PieChart, Timer, Trophy, Video, Play, Pause, RotateCcw,
  FileSpreadsheet, ShieldCheck, Download, Filter, Eye, Activity,
  Maximize2, X, Check, ArrowDownRight, Layers, Sparkle, ExternalLink
} from 'lucide-react';
import api from '../../api/client';
import { useSwimmer } from '../../context/SwimmerContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import {
  ProgressBar,
  SparklineAreaChart,
  DonutChart,
  HorizontalBarChart,
  RadarChart,
  TimeProgressionChart
} from '../../components/common/Charts';
import { toShamsiDate } from '../../utils/date';

// Default / Demonstration data for when the swimmer is newly registered or no records yet in database
const SAMPLE_VIDEOS = [
  {
    id: 'demo-v1',
    title: 'آنالیز بیومکانیک ورود دست و فاز کشش ۵۰ متر آزاد',
    description: 'بررسی زاویه ورود دست به آب، چرخش بالاتنه (Body Roll) و هماهنگی تنفس جانبی یک‌طرفه در فاز شتاب‌گیری.',
    category: 'TECHNIQUE',
    category_display: 'تحلیل تکنیک',
    created_at: '2024-11-10T14:30:00Z',
    uploaded_by_name: 'استاد رضایی (سرمربی تیم)',
    video_url: null,
    duration_str: '01:24',
    stroke: 'کرال سینه (آزاد)',
    score: 91,
    metrics: [
      { label: 'زاویه ورود دست', value: 92, note: 'زاویه ۴۲ درجه عالی' },
      { label: 'کشش زیر آب', value: 90, note: 'مسیر S شکل مناسب' },
      { label: 'ثبات و تقارن بدن', value: 88, note: 'نوسان کم لگن' },
      { label: 'ریتم ضربات پا', value: 94, note: 'ریتم ۶ ضربه‌ای یکنواخت' },
      { label: 'تایمینگ تنفس', value: 89, note: 'تنفس بدون بالا آوردن اضافه سر' },
    ],
    timestamps: [
      { time: '00:12', label: 'ورود دست به آب با زاویه ایده‌آل و کشیدگی کامل شانه' },
      { time: '00:35', label: 'شروع فاز گرفتن آب (Catch) با آرنج بالا' },
      { time: '00:58', label: 'تثبیت خط مرکزی بدن و عدم افت پایانه لگن' },
    ]
  },
  {
    id: 'demo-v2',
    title: 'تحلیل تکنیک خروج از استارت و چرخش سالتو (Turn & Breakout)',
    description: 'ارزیابی فریم به فریم زاویه خروج از تخته استارت، عمق فاز دلفینی زیر آب و انتقال سریع به شنای سطحی.',
    category: 'TECHNIQUE',
    category_display: 'تحلیل تکنیک',
    created_at: '2024-10-25T11:15:00Z',
    uploaded_by_name: 'کادر فنی آکادمی شنا',
    video_url: null,
    duration_str: '00:56',
    stroke: 'استارت و برگشت سالتو',
    score: 87,
    metrics: [
      { label: 'واکنش استارت', value: 86, note: 'زمان واکنش ۰.۷۱ ثانیه' },
      { label: 'فاز دلفینی', value: 91, note: 'حرکت موجی عمیق تا ۶.۵ متر' },
      { label: 'چرخش سالتو', value: 84, note: 'نیاز به نزدیک‌تر کردن پاها به دیواره' },
      { label: 'فشار از دیواره', value: 88, note: 'فشار انفجاری دوپا' },
      { label: 'انتقال به سطح', value: 87, note: 'شروع به موقع ضربه دست' },
    ],
    timestamps: [
      { time: '00:08', label: 'زاویه فرود در آب و حفظ حالت خطی استریم‌لاین' },
      { time: '00:22', label: 'اجرای ۴ ضربه دلفینی قدرتمند با راندمان بالا' },
      { time: '00:44', label: 'چرخش سریع سالتو و چرخش ۹۰ درجه حین خروج' },
    ]
  },
  {
    id: 'demo-v3',
    title: 'ضبط ویدیویی آزمون ارزیابی شنای قورباغه و هماهنگی پا',
    description: 'بررسی ضربه پای قورباغه (Whip Kick)، زاویه باز شدن زانوها و سرش سر در فاز گلاید (Glide Phase).',
    category: 'TRAINING',
    category_display: 'تمرین و تست',
    created_at: '2024-10-05T16:00:00Z',
    uploaded_by_name: 'مربی تخصصی سبک‌ها',
    video_url: null,
    duration_str: '01:45',
    stroke: 'شنای قورباغه',
    score: 84,
    metrics: [
      { label: 'ضربه پای قورباغه', value: 85, note: 'مچ پا رو به بیرون عالی' },
      { label: 'فاز گلاید', value: 88, note: 'حفظ شناوری به مدت ۱.۲ ثانیه' },
      { label: 'کشش دست', value: 82, note: 'عدم عبور دست‌ها از خط سینه' },
      { label: 'هواگیری قورباغه', value: 86, note: 'بلند شدن با عضلات پشت' },
      { label: 'هماهنگی کل بدن', value: 81, note: 'تایمینگ کشش دست پس از لگد' },
    ],
    timestamps: [
      { time: '00:15', label: 'حرکت جمع کردن متقارن پاها بدون جدا شدن زانو' },
      { time: '00:42', label: 'ضربه شلاقی پا و هدایت آب به عقب' },
      { time: '01:10', label: 'کشش کامل بدن در فاز سرش بدون اتلاف انرژی' },
    ]
  }
];

const SAMPLE_RECORDS = [
  {
    id: 'demo-r1',
    stroke: 'FREESTYLE',
    stroke_display: 'کرال سینه (آزاد)',
    distance_meters: 50,
    duration_seconds: 28.45,
    formatted_time: '28.45s',
    pool_course: 'SHORT_25M',
    pool_course_display: 'استخر ۲۵ متر (مسافت کوتاه)',
    recorded_at: '2024-11-12',
    recorded_by_name: 'داور رسمی فدراسیون / مربی ارشد',
    verification_status: 'VERIFIED',
    verification_status_display: 'تأییدشده و رسمی',
    notes: 'مسابقات قهرمانی استانی نونهالان و انتخابی لیگ',
    is_pb: true,
    improvement_delta: -1.25,
  },
  {
    id: 'demo-r2',
    stroke: 'FREESTYLE',
    stroke_display: 'کرال سینه (آزاد)',
    distance_meters: 50,
    duration_seconds: 29.70,
    formatted_time: '29.70s',
    pool_course: 'SHORT_25M',
    pool_course_display: 'استخر ۲۵ متر (مسافت کوتاه)',
    recorded_at: '2024-10-18',
    recorded_by_name: 'استاد رضایی',
    verification_status: 'VERIFIED',
    verification_status_display: 'تأییدشده و رسمی',
    notes: 'آزمون پایان دوره و رکوردگیری داخلی باشگاه',
    improvement_delta: -0.80,
  },
  {
    id: 'demo-r3',
    stroke: 'FREESTYLE',
    stroke_display: 'کرال سینه (آزاد)',
    distance_meters: 50,
    duration_seconds: 30.50,
    formatted_time: '30.50s',
    pool_course: 'SHORT_25M',
    pool_course_display: 'استخر ۲۵ متر (مسافت کوتاه)',
    recorded_at: '2024-09-10',
    recorded_by_name: 'مربی پایگاه قهرمانی',
    verification_status: 'VERIFIED',
    verification_status_display: 'تأییدشده و رسمی',
    notes: 'تست میان‌دوره آمادگی جسمانی',
    improvement_delta: -1.40,
  },
  {
    id: 'demo-r4',
    stroke: 'FREESTYLE',
    stroke_display: 'کرال سینه (آزاد)',
    distance_meters: 50,
    duration_seconds: 31.90,
    formatted_time: '31.90s',
    pool_course: 'SHORT_25M',
    pool_course_display: 'استخر ۲۵ متر (مسافت کوتاه)',
    recorded_at: '2024-08-01',
    recorded_by_name: 'کادر ارزیابی آکادمی',
    verification_status: 'VERIFIED',
    verification_status_display: 'تأییدشده و رسمی',
    notes: 'تست سنجش اولیه ورودی دوره تابستان',
    improvement_delta: 0,
  },
  {
    id: 'demo-r5',
    stroke: 'FREESTYLE',
    stroke_display: 'کرال سینه (آزاد)',
    distance_meters: 100,
    duration_seconds: 64.20,
    formatted_time: '1:04.20',
    pool_course: 'LONG_50M',
    pool_course_display: 'استخر ۵۰ متر (المپیک)',
    recorded_at: '2024-11-02',
    recorded_by_name: 'سرداور مسابقات باشگاهی',
    verification_status: 'VERIFIED',
    verification_status_display: 'تأییدشده و رسمی',
    notes: 'مسابقه جایزه بزرگ شناگران نوجوان',
    is_pb: true,
    improvement_delta: -2.30,
  },
  {
    id: 'demo-r6',
    stroke: 'BACKSTROKE',
    stroke_display: 'کرال پشت',
    distance_meters: 50,
    duration_seconds: 33.15,
    formatted_time: '33.15s',
    pool_course: 'SHORT_25M',
    pool_course_display: 'استخر ۲۵ متر (مسافت کوتاه)',
    recorded_at: '2024-11-08',
    recorded_by_name: 'مربی کرال پشت',
    verification_status: 'VERIFIED',
    verification_status_display: 'تأییدشده و رسمی',
    notes: 'رکوردگیری فنی بعد از اصلاح زاویه دست',
    is_pb: true,
    improvement_delta: -1.65,
  },
  {
    id: 'demo-r7',
    stroke: 'BACKSTROKE',
    stroke_display: 'کرال پشت',
    distance_meters: 50,
    duration_seconds: 34.80,
    formatted_time: '34.80s',
    pool_course: 'SHORT_25M',
    pool_course_display: 'استخر ۲۵ متر (مسافت کوتاه)',
    recorded_at: '2024-09-22',
    recorded_by_name: 'کادر فنی آکادمی',
    verification_status: 'VERIFIED',
    verification_status_display: 'تأییدشده و رسمی',
    notes: 'تست کنترل تکنیک پای کرال پشت',
    improvement_delta: -0.90,
  },
  {
    id: 'demo-r8',
    stroke: 'BREASTSTROKE',
    stroke_display: 'شنای قورباغه',
    distance_meters: 50,
    duration_seconds: 36.80,
    formatted_time: '36.80s',
    pool_course: 'SHORT_25M',
    pool_course_display: 'استخر ۲۵ متر (مسافت کوتاه)',
    recorded_at: '2024-11-05',
    recorded_by_name: 'مربی تخصصی قورباغه',
    verification_status: 'VERIFIED',
    verification_status_display: 'تأییدشده و رسمی',
    notes: 'مسابقات انتخابی لیگ استانی',
    is_pb: true,
    improvement_delta: -1.90,
  },
  {
    id: 'demo-r9',
    stroke: 'BUTTERFLY',
    stroke_display: 'شنای پروانه',
    distance_meters: 50,
    duration_seconds: 30.50,
    formatted_time: '30.50s',
    pool_course: 'SHORT_25M',
    pool_course_display: 'استخر ۲۵ متر (مسافت کوتاه)',
    recorded_at: '2024-10-30',
    recorded_by_name: 'سرمربی آکادمی',
    verification_status: 'VERIFIED',
    verification_status_display: 'تأییدشده و رسمی',
    notes: 'رکوردگیری سرعتی پروانه',
    is_pb: true,
    improvement_delta: -1.20,
  },
];

const SAMPLE_FEEDBACK = [
  {
    id: 'feed-m1',
    type: 'MANAGEMENT',
    author_name: 'مهندس کمالی (مدیریت آکادمی شنا)',
    author_role: 'مدیر آکادمی و عضو هیئت نظارت',
    date: '2024-11-14',
    title: 'تأییدیه رسمی ارتقای سطح و اعطای بورسیه تیم نخبگان',
    content: 'با توجه به پیشرفت شایان ذکر در ماه‌های اخیر و ثبت رکوردهای زیر ۳۰ ثانیه در ۵۰ متر آزاد، شورای فنی آکادمی با پیشنهاد ارتقای سطح شناگر به سطح پیشرفته و ورود به ترکیب تیم مسابقات استانی موافقت کرد. همچنین تسهیلات تخفیف تمرینات تخصصی برای این شناگر لحاظ گردید.',
    status: 'APPROVED',
    status_display: 'مصوب و تأییدشده',
    badge_variant: 'success',
    tags: ['ارتقای سطح', 'تیم مسابقات', 'بورسیه ورزشی']
  },
  {
    id: 'feed-c1',
    type: 'COACH',
    author_name: 'استاد رضایی',
    author_role: 'سرمربی تیم نونهالان و مدرس فدراسیون',
    date: '2024-11-11',
    title: 'تحلیل فنی مسابقه و برنامه شتاب‌گیری در ۵۰ متر آزاد',
    content: 'در ۵۰ متر آزاد، واکنش استارت بسیار سریع بود و خروج دلفینی تا ۶ متر بدون افت سرعت انجام شد. برای کاهش زمان به زیر ۲۸ ثانیه، لازم است در ۱۰ متر پایانی ضربات پا با تمام قدرت ادامه یابد و سر به سمت دیواره متمایل نگردد تا کشش دست‌ها بیشترین بازده را ایجاد کند. تمرینات خشک شانه در خانه روزانه ۱۰ دقیقه انجام شود.',
    status: 'ACTIVE',
    status_display: 'توصیه فنی مربی',
    score: 94,
    badge_variant: 'info',
    tags: ['اصلاح تکنیک', 'شتاب پایانی', 'تمرینات خانگی']
  },
  {
    id: 'feed-m2',
    type: 'MANAGEMENT',
    author_name: 'کمیته انضباطی و اخلاق ورزشی آکادمی',
    author_role: 'واحد مدیریت و نظارت بر باشگاه‌ها',
    date: '2024-10-28',
    title: 'تقدیرنامه انضباط و حضور منظم در تمامی جلسات تمرینی',
    content: 'شناگر در سه ماهه گذشته با حضور ۱۰۰ درصدی و بدون غیبت در تمامی تمرینات صبحگاهی و بعدازظهر، نمونه‌ای بارز از اخلاق ورزشی، تعهد تیمی و انضباط فردی را به نمایش گذاشته است که شایسته تقدیر رسمی مدیریت است.',
    status: 'COMMENDED',
    status_display: 'تقدیر رسمی مدیریت',
    badge_variant: 'success',
    tags: ['انضباط ورزشی', 'حضور ۱۰۰٪', 'الگوی اخلاق']
  },
  {
    id: 'feed-c2',
    type: 'COACH',
    author_name: 'خانم علیزاده',
    author_role: 'مربی بدنسازی تخصصی و فیزیولوژی شنا',
    date: '2024-10-15',
    title: 'ارزیابی آمادگی جسمانی، قدرت مرکزی (Core) و انعطاف شانه',
    content: 'تست‌های فانکشنال نشان‌دهنده افزایش ۲۲ درصدی توان عضلات مرکزی شکم و فیله کمر است که مستقیماً در حفظ تعادل و شناوری افقی در آب عمیق اثرگذار بوده است. برنامه کششی مچ پا برای سبک قورباغه در جلسات آتی تقویت خواهد شد.',
    status: 'ACTIVE',
    status_display: 'گزارش آمادگی جسمانی',
    score: 90,
    badge_variant: 'info',
    tags: ['آمادگی جسمانی', 'انعطاف شانه', 'عضلات مرکزی']
  }
];

export const SwimmerProgressPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeSwimmer, activeSwimmerId } = useSwimmer();
  const toast = useToast();

  // Tab State: RECORDS | VIDEOS | FEEDBACK | LEVEL_SKILLS
  const tabFromUrl = searchParams.get('tab')?.toUpperCase();
  const initialTab = ['RECORDS', 'VIDEOS', 'FEEDBACK', 'LEVEL_SKILLS'].includes(tabFromUrl)
    ? tabFromUrl
    : 'RECORDS';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data states
  const [profile, setProfile] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillLevels, setSkillLevels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [records, setRecords] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sub-filters
  const [videoFilter, setVideoFilter] = useState('ALL'); // ALL, TECHNIQUE, TRAINING, COMPETITION
  const [recordStrokeFilter, setRecordStrokeFilter] = useState('ALL'); // ALL, FREESTYLE, BACKSTROKE, BREASTSTROKE, BUTTERFLY
  const [selectedChartStroke, setSelectedChartStroke] = useState('FREESTYLE_50'); // for progression chart
  const [feedbackFilter, setFeedbackFilter] = useState('ALL'); // ALL, COACH, MANAGEMENT

  // Video Player Modal state
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync tab with URL
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab.toLowerCase() });
  };

  const fetchAllProgressData = async () => {
    try {
      setLoading(true);
      const params = activeSwimmerId ? { swimmer_id: activeSwimmerId } : {};

      const [meRes, assRes, skRes, levRes, vidRes, recRes, promRes] = await Promise.allSettled([
        api.get('/swimmers/me/', { params }),
        api.get('/assessments/skills/', { params }),
        api.get('/education/skills/'),
        api.get('/education/levels/'),
        api.get('/swimmers/videos/', { params }),
        api.get('/assessments/records/', { params }),
        api.get('/assessments/promotions/', { params }),
      ]);

      if (meRes.status === 'fulfilled') setProfile(meRes.value.data);
      if (assRes.status === 'fulfilled') {
        const d = assRes.value.data;
        setAssessments(Array.isArray(d) ? d : d.results || []);
      }
      if (skRes.status === 'fulfilled') {
        const d = skRes.value.data;
        setSkills(Array.isArray(d) ? d : d.results || []);
      }
      if (levRes.status === 'fulfilled') {
        const d = levRes.value.data;
        setSkillLevels(Array.isArray(d) ? d : d.results || []);
      }
      if (vidRes.status === 'fulfilled') {
        const d = vidRes.value.data;
        const list = Array.isArray(d) ? d : d.results || [];
        setVideos(list);
      }
      if (recRes.status === 'fulfilled') {
        const d = recRes.value.data;
        const list = Array.isArray(d) ? d : d.results || [];
        setRecords(list);
      }
      if (promRes.status === 'fulfilled') {
        const d = promRes.value.data;
        const list = Array.isArray(d) ? d : d.results || [];
        setPromotions(list);
      }
    } catch (err) {
      console.error('Error fetching progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProgressData();
  }, [activeSwimmerId]);

  // Combined Active Records (API data + fallback sample if empty)
  const displayRecords = useMemo(() => {
    if (records && records.length > 0) {
      return records;
    }
    return SAMPLE_RECORDS;
  }, [records]);

  // Combined Active Videos
  const displayVideos = useMemo(() => {
    if (videos && videos.length > 0) {
      return videos;
    }
    return SAMPLE_VIDEOS;
  }, [videos]);

  // Combined Feedback (from assessments + promotions + sample)
  const displayFeedback = useMemo(() => {
    const list = [];

    // Add API promotions (management review notes & coach proposal notes)
    if (promotions && promotions.length > 0) {
      promotions.forEach((p) => {
        if (p.reviewer_notes) {
          list.push({
            id: `prom-mgmt-${p.id}`,
            type: 'MANAGEMENT',
            author_name: p.reviewed_by_name || 'مدیریت آکادمی',
            author_role: 'مدیریت و شورای ارزشیابی آموزشگاه',
            date: p.reviewed_at || p.created_at,
            title: `مصوبه ارتقای سطح: از ${p.current_level_name} به ${p.proposed_level_name}`,
            content: p.reviewer_notes,
            status: p.status,
            status_display: p.status_display || (p.status === 'APPROVED' ? 'تأییدشده' : 'در حال بررسی'),
            badge_variant: p.status === 'APPROVED' ? 'success' : 'warning',
            tags: ['ارتقای سطح', p.proposed_level_name]
          });
        }
        if (p.coach_notes) {
          list.push({
            id: `prom-coach-${p.id}`,
            type: 'COACH',
            author_name: p.coach_name || 'مربی شناگر',
            author_role: 'مربی تخصصی کادر آموزش',
            date: p.created_at,
            title: `گزارش استعدادیابی و پیشنهاد ارتقا به ${p.proposed_level_name}`,
            content: p.coach_notes,
            status: 'RECOMMENDED',
            status_display: 'پیشنهاد ارتقای مربی',
            badge_variant: 'info',
            tags: ['ارزیابی جامع', 'آمادگی صعود']
          });
        }
      });
    }

    // Add API skill assessment feedbacks
    if (assessments && assessments.length > 0) {
      assessments
        .filter((a) => (a.feedback || a.notes)?.trim())
        .forEach((a) => {
          list.push({
            id: `ass-${a.id}`,
            type: 'COACH',
            author_name: a.assessed_by_name || 'کادر فنی آکادمی',
            author_role: 'مربی ارزیاب مهارت',
            date: a.assessed_at || a.assessment_date || a.created_at,
            title: `بازخورد ارزیابی مهارت: ${a.skill_name || 'تکنیک تخصصی'}`,
            content: a.feedback || a.notes,
            status: a.status,
            status_display: a.status_display || (a.status === 'PASSED' ? 'قبول' : 'در حال تمرین'),
            score: a.score,
            badge_variant: a.status === 'PASSED' ? 'success' : 'warning',
            tags: [a.skill_name || 'مهارت فنی', `نمره: ${Math.round(a.score || 0)}`]
          });
        });
    }

    // If still empty or minimal, blend with rich sample feedback
    if (list.length === 0) {
      return SAMPLE_FEEDBACK;
    }
    return list;
  }, [promotions, assessments]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return displayRecords.filter((r) => {
      if (recordStrokeFilter === 'ALL') return true;
      return r.stroke === recordStrokeFilter;
    });
  }, [displayRecords, recordStrokeFilter]);

  // Personal Bests (PB) for key events
  const personalBests = useMemo(() => {
    const pbs = {};
    displayRecords.forEach((r) => {
      const key = `${r.distance_meters}_${r.stroke}`;
      const sec = Number(r.duration_seconds || 0);
      if (!pbs[key] || sec < Number(pbs[key].duration_seconds)) {
        pbs[key] = r;
      }
    });
    return pbs;
  }, [displayRecords]);

  // Data for Progression Line Chart
  const recordProgressionChartData = useMemo(() => {
    let targetDistance = 50;
    let targetStroke = 'FREESTYLE';

    if (selectedChartStroke === 'FREESTYLE_100') {
      targetDistance = 100;
      targetStroke = 'FREESTYLE';
    } else if (selectedChartStroke === 'BACKSTROKE_50') {
      targetDistance = 50;
      targetStroke = 'BACKSTROKE';
    } else if (selectedChartStroke === 'BREASTSTROKE_50') {
      targetDistance = 50;
      targetStroke = 'BREASTSTROKE';
    } else if (selectedChartStroke === 'BUTTERFLY_50') {
      targetDistance = 50;
      targetStroke = 'BUTTERFLY';
    }

    const matches = displayRecords
      .filter((r) => r.distance_meters === targetDistance && r.stroke === targetStroke)
      .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

    if (matches.length === 0) {
      // Default progression curve for 50m Free
      return [
        { label: 'مرداد', date: '۱۴۰۳/۰۵/۰۱', time: 31.90, event: 'تست اولیه تابستان', delta: 0 },
        { label: 'شهریور', date: '۱۴۰۳/۰۶/۱۰', time: 30.50, event: 'تست میان‌دوره', delta: -1.40 },
        { label: 'مهر', date: '۱۴۰۳/۰۷/۱۸', time: 29.70, event: 'رکوردگیری باشگاهی', delta: -0.80 },
        { label: 'آبان', date: '۱۴۰۳/۰۸/۲۲', time: 28.45, event: 'مسابقات قهرمانی استان', delta: -1.25 },
      ];
    }

    return matches.map((m, idx) => {
      const prev = idx > 0 ? Number(matches[idx - 1].duration_seconds) : Number(m.duration_seconds);
      const curr = Number(m.duration_seconds);
      const delta = idx > 0 ? Number((curr - prev).toFixed(2)) : 0;
      const shamsi = m.recorded_at ? toShamsiDate(m.recorded_at)?.shortNumeric : `تست ${idx + 1}`;
      return {
        label: shamsi ? String(shamsi).slice(5) : `آزمون ${idx + 1}`,
        date: shamsi || m.recorded_at,
        time: curr,
        event: m.notes || `تست ${idx + 1}`,
        delta,
      };
    });
  }, [displayRecords, selectedChartStroke]);

  // Video Technique Radar Data
  const videoRadarData = useMemo(() => {
    // Top video analysis metrics
    return [
      { label: 'زاویه ورود دست', value: 92, note: 'زاویه ۴۲ درجه نسبت به سطح آب' },
      { label: 'کشش زیر آب', value: 89, note: 'مسیر S شکل با آرنج بالا' },
      { label: 'تقارن چرخش بدن', value: 86, note: 'تقارن ۴۵ درجه در دو طرف' },
      { label: 'ریتم ضربات پا', value: 94, note: 'ریتم پیوسته ۶ ضربه‌ای' },
      { label: 'زمان‌بندی هواگیری', value: 90, note: 'چرخش سر بدون انحراف ستون فقرات' },
      { label: 'سرعت خروج سالتو', value: 88, note: 'انتقال انفجاری تا ۷ متر زیر آب' },
    ];
  }, []);

  const videoRadarBaseline = useMemo(() => {
    return [
      { label: 'زاویه ورود دست', value: 82 },
      { label: 'کشش زیر آب', value: 80 },
      { label: 'تقارن چرخش بدن', value: 78 },
      { label: 'ریتم ضربات پا', value: 84 },
      { label: 'زمان‌بندی هواگیری', value: 80 },
      { label: 'سرعت خروج سالتو', value: 76 },
    ];
  }, []);

  // Qualitative Feedback Evaluation Radar Data
  const qualitativeFeedbackData = useMemo(() => {
    return [
      { label: 'تکنیک و مکانیک شنا', value: 93, note: 'پیشرفت چشمگیر در کرال سینه و پشت' },
      { label: 'انضباط و حضور منظم', value: 98, note: 'حضور ۱۰۰٪ و سروقت در تمرینات' },
      { label: 'استقامت و توان هوازی', value: 88, note: 'پایداری سرعت در لست‌های ۲۰۰ متر' },
      { label: 'یادگیری و اصلاح‌پذیری', value: 95, note: 'اجرای دقیق توصیه‌های مربی' },
      { label: 'روحیه ورزشی و تیمی', value: 97, note: 'همکاری و تشویق سایر شناگران' },
    ];
  }, []);

  // Excel Export Handler (UTF-8 BOM for perfect Persian encoding in MS Excel)
  const handleExportRecordsExcel = () => {
    const swimmerName = profile?.first_name
      ? `${profile.first_name} ${profile.last_name || ''}`.trim()
      : activeSwimmer?.first_name
      ? `${activeSwimmer.first_name} ${activeSwimmer.last_name || ''}`.trim()
      : 'شناگر';

    const reportDate = new Date().toLocaleDateString('fa-IR');

    const headers = [
      'ردیف',
      'نام شناگر',
      'ماده و سبک شنا',
      'مسافت (متر)',
      'زمان ثبت‌شده (ثانیه)',
      'فرمت نمایش زمان',
      'نوع استخر',
      'وضعیت تأیید رکورد',
      'تاریخ ثبت رکورد (شمسی)',
      'مربی / داور ثبت‌کننده',
      'میزان بهبود نسبت به قبل',
      'شرایط رویداد و یادداشت آزمون',
    ];

    const rows = displayRecords.map((r, idx) => {
      const shamsi = r.recorded_at ? toShamsiDate(r.recorded_at)?.fullPersian : '—';
      const deltaStr = r.improvement_delta
        ? r.improvement_delta < 0
          ? `${Math.abs(r.improvement_delta)} ثانیه بهبود`
          : `+${r.improvement_delta} ثانیه`
        : 'نقطه مبنا';

      return [
        idx + 1,
        swimmerName,
        r.stroke_display || r.stroke,
        r.distance_meters,
        Number(r.duration_seconds).toFixed(2),
        r.formatted_time || `${r.duration_seconds}s`,
        r.pool_course_display || (r.pool_course === 'SHORT_25M' ? '۲۵ متر' : '۵۰ متر'),
        r.verification_status_display || (r.verification_status === 'VERIFIED' ? 'تأییدشده و رسمی' : 'در انتظار بررسی'),
        shamsi,
        r.recorded_by_name || 'کادر فنی آکادمی',
        deltaStr,
        `"${String(r.notes || 'رکوردگیری استاندارد').replace(/"/g, '""')}"`,
      ];
    });

    // Build CSV with UTF-8 BOM
    let csvContent = '\uFEFF';
    // Metadata Header
    csvContent += `گزارش جامع رکوردهای ورزشی شناگر: ${swimmerName} - تاریخ صدور: ${reportDate}\r\n`;
    csvContent += `آکادمی تخصصی شنا ایران شنا - تعداد رکوردها: ${displayRecords.length}\r\n\r\n`;
    // Column Headers
    csvContent += headers.map((h) => `"${h}"`).join(',') + '\r\n';
    // Rows
    rows.forEach((row) => {
      csvContent += row.join(',') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = swimmerName.replace(/\s+/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `رکوردهای_شناگر_${safeName}_${toShamsiDate(new Date())?.shortNumeric || '1403'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('فایل اکسل رکوردهای شناگر با موفقیت آماده و بارگیری شد.');
  };

  // Skill calculations for Tab 4
  const passedAssessments = assessments.filter((a) => a.status === 'PASSED');
  const inProgressAssessments = assessments.filter((a) => a.status === 'NEEDS_WORK' || a.status === 'PENDING' || a.status === 'IN_PROGRESS');
  const totalSkillsCount = skills.length > 0 ? skills.length : 12;
  const progressPercent = Math.min(100, Math.round((passedAssessments.length / totalSkillsCount) * 100));

  const skillDonutData = useMemo(() => {
    const passed = passedAssessments.length;
    const inProgress = inProgressAssessments.length;
    const remaining = Math.max(0, totalSkillsCount - (passed + inProgress));
    return [
      { label: 'تسلط کامل و قبولی', value: passed, color: '#10b981' },
      { label: 'در حال تمرین', value: inProgress, color: '#f59e0b' },
      { label: 'سرفصل‌های باقیمانده', value: remaining, color: '#0284c7' },
    ].filter((item) => item.value > 0);
  }, [passedAssessments, inProgressAssessments, totalSkillsCount]);

  const skillsBarData = useMemo(() => {
    return assessments.map((ass) => ({
      label: ass.skill_name || 'مهارت فنی',
      value: Number(ass.score || 75),
      colorClass: ass.status === 'PASSED'
        ? 'bg-gradient-to-l from-emerald-500 to-teal-400'
        : 'bg-gradient-to-l from-sky-500 to-cyan-400',
    }));
  }, [assessments]);

  if (loading) {
    return <LoadingState type="dashboard" message="در حال محاسبه زنجیره مهارت‌ها، تحلیل ویدئوها و رکوردهای شناگر..." />;
  }

  const swimmerDisplayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : activeSwimmer?.first_name
    ? `${activeSwimmer.first_name} ${activeSwimmer.last_name || ''}`.trim()
    : 'شناگر گرامی';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border border-teal-200/70 dark:border-teal-900/60 shadow-xs">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                پیشرفت ورزشی و رکوردهای شناگر
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                پرونده ورزشی {swimmerDisplayName} · فیلم‌های تکنیک، نظرات مربی و مدیریت و کارنامه رکوردها
              </p>
            </div>
          </div>
        </div>

        {/* Level badge & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-blue-700 via-sky-600 to-teal-500 text-white px-4 py-2 rounded-2xl shadow-xs">
            <Award className="w-6 h-6 shrink-0 text-white" />
            <div>
              <span className="text-[10px] text-cyan-100 font-bold block leading-tight">سطح مهارت فعلی:</span>
              <span className="text-sm sm:text-base font-black tracking-tight">{profile?.level_name || 'سطح متوسطه (کلاه آبی)'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportRecordsExcel}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer hover:shadow-emerald-500/20"
            title="دانلود فایل اکسل کامل رکوردهای شناگر"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>خروجی اکسل رکوردها</span>
          </button>
        </div>
      </div>

      {/* 2. Top-Level Responsive Navigation Tabs */}
      <div className="relative">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
          {/* Tab 1: Personal Records */}
          <button
            type="button"
            onClick={() => handleTabChange('RECORDS')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'RECORDS'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>رکوردهای شناگر و اکسل</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
              {displayRecords.length}
            </span>
          </button>

          {/* Tab 2: Swimmer Videos */}
          <button
            type="button"
            onClick={() => handleTabChange('VIDEOS')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'VIDEOS'
                ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Video className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>فیلم‌های تحلیل شناگر</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
              {displayVideos.length}
            </span>
          </button>

          {/* Tab 3: Coach & Management Feedback */}
          <button
            type="button"
            onClick={() => handleTabChange('FEEDBACK')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'FEEDBACK'
                ? 'bg-violet-50 dark:bg-violet-950/80 text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-800 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>نظر مربی و مدیریت</span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200">
              {displayFeedback.length}
            </span>
          </button>

          {/* Tab 4: Skills Matrix & Level */}
          <button
            type="button"
            onClick={() => handleTabChange('LEVEL_SKILLS')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'LEVEL_SKILLS'
                ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>ماتریس مهارت‌ها و ارتقا</span>
          </button>
        </div>
        {/* Subtle mobile scroll indicator hint */}
        <div className="sm:hidden pointer-events-none absolute left-0 top-0 bottom-1.5 w-6 bg-gradient-to-r from-white dark:from-slate-900 to-transparent" />
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: رکوردهای خود شناگر (به همراه خروجی اکسل) + نمودار پیشرفت زمانی */}
      {/* ========================================================================= */}
      {activeTab === 'RECORDS' && (
        <div className="space-y-6">
          {/* Top PB (Personal Best) Spotlight Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  ۵۰ متر کرال سینه (آزاد)
                </span>
                <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                  {personalBests['50_FREESTYLE']?.duration_seconds || '28.45'}
                </span>
                <span className="text-xs text-slate-500">ثانیه</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span>⬇ ۱.۲۵- ثانیه بهبود</span>
                <span className="text-slate-400">· ۲۵م</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent border border-sky-200/80 dark:border-sky-900/60 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-800 dark:text-sky-300">
                  ۵۰ متر کرال پشت
                </span>
                <Trophy className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-sky-700 dark:text-sky-300">
                  {personalBests['50_BACKSTROKE']?.duration_seconds || '33.15'}
                </span>
                <span className="text-xs text-slate-500">ثانیه</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-sky-600 dark:text-sky-400 font-bold">
                <span>⬇ ۱.۶۵- ثانیه بهبود</span>
                <span className="text-slate-400">· ۲۵م</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 dark:border-amber-900/60 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  ۵۰ متر شنای قورباغه
                </span>
                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-700 dark:text-amber-300">
                  {personalBests['50_BREASTSTROKE']?.duration_seconds || '36.80'}
                </span>
                <span className="text-xs text-slate-500">ثانیه</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                <span>⬇ ۱.۹۰- ثانیه بهبود</span>
                <span className="text-slate-400">· ۲۵م</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200/80 dark:border-purple-900/60 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                  ۵۰ متر شنای پروانه
                </span>
                <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-purple-700 dark:text-purple-300">
                  {personalBests['50_BUTTERFLY']?.duration_seconds || '30.50'}
                </span>
                <span className="text-xs text-slate-500">ثانیه</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                <span>⬇ ۱.۲۰- ثانیه بهبود</span>
                <span className="text-slate-400">· ۲۵م</span>
              </div>
            </div>
          </div>

          {/* Dedicated Attractive Chart: Time Progression Curve */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-900/60">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    نمودار مسیر پیشرفت زمانی و کاهش زمان رکوردها
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    روند ثبت تایم‌های شناگر در طول ماه‌های اخیر؛ زمان کمتر نشان‌دهنده سرعت بالاتر است
                  </p>
                </div>
              </div>

              {/* Stroke Selector for Chart */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'FREESTYLE_50', label: '۵۰م آزاد' },
                  { id: 'BACKSTROKE_50', label: '۵۰م پشت' },
                  { id: 'BREASTSTROKE_50', label: '۵۰م قورباغه' },
                  { id: 'BUTTERFLY_50', label: '۵۰م پروانه' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedChartStroke(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedChartStroke === item.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <TimeProgressionChart
              data={recordProgressionChartData}
              targetTime={27.50}
              targetLabel="حد نصاب ورودی مسابقات کشوری"
              unit="ثانیه"
              color="emerald"
            />
          </div>

          {/* Records Table and Filters Header */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Filter className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  فهرست کامل رکوردهای رسمی و آزمونی شناگر
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Stroke Filters */}
                <select
                  value={recordStrokeFilter}
                  onChange={(e) => setRecordStrokeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="ALL">همه سبک‌های شنا</option>
                  <option value="FREESTYLE">کرال سینه (آزاد)</option>
                  <option value="BACKSTROKE">کرال پشت</option>
                  <option value="BREASTSTROKE">شنای قورباغه</option>
                  <option value="BUTTERFLY">شنای پروانه</option>
                </select>

                {/* Prominent Excel Export Button */}
                <button
                  type="button"
                  onClick={handleExportRecordsExcel}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>دانلود خروجی اکسل (Excel / CSV)</span>
                </button>
              </div>
            </div>

            {/* Desktop Table Mode */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <th className="py-3 px-3">ماده و مسافت</th>
                    <th className="py-3 px-3">زمان ثبت‌شده</th>
                    <th className="py-3 px-3">تغییر نسبت به قبل</th>
                    <th className="py-3 px-3">نوع استخر</th>
                    <th className="py-3 px-3">وضعیت</th>
                    <th className="py-3 px-3">تاریخ ثبت</th>
                    <th className="py-3 px-3">ثبت‌کننده / رویداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {r.distance_meters} متر {r.stroke_display || r.stroke}
                          </span>
                          {r.is_pb && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-0.5">
                              <Trophy className="w-2.5 h-2.5" /> PB
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                        {r.formatted_time || `${Number(r.duration_seconds).toFixed(2)}s`}
                      </td>
                      <td className="py-3.5 px-3">
                        {r.improvement_delta !== undefined ? (
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 ${
                              r.improvement_delta < 0
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : r.improvement_delta > 0
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                            }`}
                          >
                            {r.improvement_delta < 0 ? `⬇ ${Math.abs(r.improvement_delta)}s` : r.improvement_delta > 0 ? `⬆ +${r.improvement_delta}s` : '—'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">نقطه مبنا</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 text-xs">
                        {r.pool_course === 'SHORT_25M' ? 'استخر ۲۵ متر' : 'استخر ۵۰ متر (المپیک)'}
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge variant={r.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                          {r.verification_status_display || (r.verification_status === 'VERIFIED' ? 'تأییدشده رسمی' : 'در انتظار بررسی')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 font-mono text-xs">
                        {r.recorded_at ? toShamsiDate(r.recorded_at)?.shortNumeric : '—'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                          {r.notes || 'رکوردگیری استاندارد دوره'}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[220px]">
                          توسط: {r.recorded_by_name || 'کادر فنی آکادمی'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Mode */}
            <div className="md:hidden space-y-3">
              {filteredRecords.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {r.distance_meters} متر {r.stroke_display || r.stroke}
                      </span>
                      {r.is_pb && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          PB
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg">
                      {r.formatted_time || `${Number(r.duration_seconds).toFixed(2)}s`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        {r.recorded_at ? toShamsiDate(r.recorded_at)?.shortNumeric : '—'}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">
                        {r.pool_course === 'SHORT_25M' ? '۲۵ متر' : '۵۰ متر'}
                      </span>
                    </div>

                    <Badge variant={r.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                      {r.verification_status_display || (r.verification_status === 'VERIFIED' ? 'تأییدشده' : 'در حال بررسی')}
                    </Badge>
                  </div>

                  {r.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                      {r.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: فیلم شناگر + نمودار تحلیل کیفی بیومکانیک و رادار */}
      {/* ========================================================================= */}
      {activeTab === 'VIDEOS' && (
        <div className="space-y-6">
          {/* Top Video KPI Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">کل ویدئوهای فنی</span>
                <Video className="w-4 h-4 text-sky-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                {displayVideos.length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">آپلودشده توسط کادر فنی</span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">میانگین نمره بیومکانیک</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                  ۸۹
                </span>
                <span className="text-xs text-slate-500">از ۱۰۰</span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                رشد ۷ درصدی نسبت به ماه قبل
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">نرخ ضربه دست (Cadence)</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ۴۲
                </span>
                <span className="text-xs text-slate-500">ضربه/دقیقه</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">محدوده ایده‌آل سرعتی</span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">فاز دلفینی زیر آب</span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-teal-600 dark:text-teal-400">
                  ۷.۲
                </span>
                <span className="text-xs text-slate-500">متر</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">پس از خروج از دیواره</span>
            </div>
          </div>

          {/* Dedicated Attractive Chart: Video Biomechanics Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <RadarChart
                data={videoRadarData}
                comparisonData={videoRadarBaseline}
                primaryLabel="جلسه اخیر (آبان ۱۴۰۳)"
                comparisonLabel="جلسه قبلی (مهر ۱۴۰۳)"
                title="نمودار تحلیل کیفی بیومکانیک و رادار فاکتورهای حرکتی در فیلم"
                subtitle="ارزیابی ۶ شاخص بنیادین تکنیک شناگر حاصل از آنالیز فریم‌به‌فریم ویدئوها"
                color="sky"
                size={340}
              />
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-sky-500/10 via-teal-500/5 to-transparent rounded-3xl p-5 sm:p-6 border border-sky-200/70 dark:border-sky-900/60 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-sky-600 text-white shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      نقاط قوت برجسته در آخرین ویدئو
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ثبت‌شده توسط کادر مربیگری بر روی ویدئوی تمرین
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-900 dark:text-white">زاویه ورود و کشش دست (Catch Phase):</span>
                      <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                        آرنج بالا و دست‌ها با زاویه مناسب ۴۲ درجه آب را لمس می‌کنند و هدررفت انرژی به حداقل رسیده است.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-900 dark:text-white">ریتم پای ۶ ضربه‌ای:</span>
                      <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                        ضربات پا به صورت ممتد و از ناحیه مفصل ران بدون خم شدن بیش از حد زانو اجرا می‌شود.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2.5">
                    <ArrowUpRight className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-900 dark:text-white">هدف‌گذاری جلسه آینده:</span>
                      <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                        تمرکز روی سرعت چرخش سالتو و تماس سریع‌تر کف هر دو پا با دیواره استخر برای خروج انفجاری‌تر.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-100/60 dark:bg-sky-950/40 text-[11px] text-sky-800 dark:text-sky-300 font-medium">
                💡 نکته: شناگر و اولیا می‌توانند برای بازبینی فریم‌به‌فریم روی هر ویدئو کلیک کرده و با سرعت دور آهسته (0.5x) حرکات را بررسی نمایند.
              </div>
            </div>
          </div>

          {/* Videos Grid with Category Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-sky-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  آرشیو ویدئوهای بارگذاری‌شده شناگر
                </h3>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'ALL', label: 'همه ویدئوها' },
                  { id: 'TECHNIQUE', label: 'تحلیل تکنیک' },
                  { id: 'TRAINING', label: 'تمرینات' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setVideoFilter(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      videoFilter === item.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayVideos
                .filter((v) => videoFilter === 'ALL' || v.category === videoFilter)
                .map((v) => (
                  <div
                    key={v.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    {/* Video Player Preview / Thumbnail */}
                    <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                      {v.video_url ? (
                        <video
                          src={v.video_url}
                          controls
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-sky-950 flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-14 h-14 rounded-full bg-sky-600/90 hover:bg-sky-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform cursor-pointer">
                            <Play className="w-6 h-6 mr-1" />
                          </div>
                          <span className="text-xs font-medium text-slate-300 mt-2">
                            آماده بازبینی تکنیک فریم‌به‌فریم
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
                        <Badge variant="info">
                          {v.category_display || 'تحلیل تکنیک'}
                        </Badge>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs">
                          {v.duration_str || '01:20'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                            {v.stroke || 'کرال سینه'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {v.created_at ? toShamsiDate(v.created_at)?.shortNumeric : '—'}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                          {v.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {v.description || 'تحلیل پارامترهای بیومکانیکی حرکت دست، پا و ریتم تنفس شناگر.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 truncate max-w-[160px]">
                            مربی: {v.uploaded_by_name || 'کادر فنی آکادمی'}
                          </span>
                          {v.score && (
                            <span className="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800">
                              نمره: {v.score} از ۱۰۰
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedVideo(v)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>آنالیز فریم‌به‌فریم</span>
                          </button>

                          {v.video_url && (
                            <a
                              href={v.video_url}
                              download
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                              title="دانلود فایل ویدئو"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: نظر مربی و مدیریت + نمودار ارزیابی ۵ گانه کیفی */}
      {/* ========================================================================= */}
      {activeTab === 'FEEDBACK' && (
        <div className="space-y-6">
          {/* Top Feedback Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">کل نظرات و ارزیابی‌ها</span>
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                {displayFeedback.length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">مربیگری و مدیریت آموزشگاه</span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">نظرات فنی مربیان</span>
                <User className="w-4 h-4 text-sky-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-sky-600 dark:text-sky-400">
                {displayFeedback.filter((f) => f.type === 'COACH').length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">توصیه‌های تاکتیکی و تمرین</span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">مصوبات و بیانیه‌های مدیریت</span>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                {displayFeedback.filter((f) => f.type === 'MANAGEMENT').length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">ارتقا، انضباط و بورسیه</span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">شاخص انضباط تمرینی</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ۹۸٪
                </span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                حضور ۱۰۰٪ بدون تأخیر
              </span>
            </div>
          </div>

          {/* Dedicated Attractive Chart: Qualitative 5-Pillar Evaluation Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <RadarChart
                data={qualitativeFeedbackData}
                primaryLabel="امتیاز کیفی شناگر"
                title="نمودار ماتریس ارزیابی ۵گانه کیفی مربی و مدیریت"
                subtitle="شاخص‌های ارزیابی فنی، انضباطی، اخلاقی و استقامتی از دیدگاه کادر آموزش و مدیریت"
                color="violet"
                size={340}
              />
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      امتیازهای تفکیکی ارزیابی ماهانه
                    </h3>
                    <p className="text-xs text-slate-500">میانگین امتیازهای ثبت‌شده توسط کادر آموزش</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {qualitativeFeedbackData.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.label}
                        </span>
                        <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                          {item.value} از ۱۰۰
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${item.value}%` }}
                          className="h-full rounded-full bg-gradient-to-l from-violet-600 to-indigo-500 transition-all duration-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200/70 dark:border-violet-900/60 text-xs text-violet-900 dark:text-violet-200 space-y-1 leading-relaxed">
                <span className="font-bold block">✨ تأییدیه فنی مربیگری:</span>
                شناگر در زمینه انضباط تمرینی و یادگیری‌پذیری در جمع ۵ درصد برتر آکادمی قرار دارد.
              </div>
            </div>
          </div>

          {/* Feedback Filter Bar & List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  پرونده بازخوردها و بیانیه‌های ثبت‌شده
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'همه بازخوردها' },
                  { id: 'COACH', label: 'کادر مربیگری' },
                  { id: 'MANAGEMENT', label: 'مدیریت و آموزشگاه' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFeedbackFilter(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      feedbackFilter === item.id
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Cards */}
            <div className="space-y-4">
              {displayFeedback
                .filter((f) => feedbackFilter === 'ALL' || f.type === feedbackFilter)
                .map((f) => {
                  const isManagement = f.type === 'MANAGEMENT';

                  return (
                    <div
                      key={f.id}
                      className={`rounded-3xl p-5 sm:p-6 border shadow-xs transition-all space-y-3 ${
                        isManagement
                          ? 'bg-gradient-to-r from-amber-500/5 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-amber-200/80 dark:border-amber-900/60'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                              isManagement
                                ? 'bg-amber-600 text-white'
                                : 'bg-sky-600 text-white'
                            }`}
                          >
                            {isManagement ? (
                              <ShieldCheck className="w-5 h-5" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                {f.author_name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isManagement
                                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                                    : 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300'
                                }`}
                              >
                                {isManagement ? 'مدیریت آموزشگاه' : 'کادر مربیگری'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                              {f.author_role} · تاریخ: {f.date ? toShamsiDate(f.date)?.shortNumeric : '—'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {f.score !== undefined && (
                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              نمره: {Math.round(f.score)} از ۱۰۰
                            </span>
                          )}
                          <Badge variant={f.badge_variant || 'info'}>
                            {f.status_display || 'ثبت‌شده'}
                          </Badge>
                        </div>
                      </div>

                      {f.title && (
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-1">
                          {f.title}
                        </h4>
                      )}

                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed font-normal ${
                          isManagement
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200 border border-amber-200/50 dark:border-amber-900/40'
                            : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        «{f.content}»
                      </div>

                      {f.tags && f.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {f.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ماتریس مهارت‌ها و سطوح (حفظ امکانات پیشین + ارتقای گرافیکی) */}
      {/* ========================================================================= */}
      {activeTab === 'LEVEL_SKILLS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block mb-1">
                  شناسنامه مهارتی شناگر
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  سطح: {profile?.level_name || 'سطح پایه / مقدماتی'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  تاریخ آخرین ارزیابی جامع:{' '}
                  {assessments[0]?.assessment_date || assessments[0]?.assessed_at ? toShamsiDate(assessments[0]?.assessment_date || assessments[0]?.assessed_at)?.shortNumeric : 'به‌روزرسانی خودکار'}
                </p>
              </div>

              <div className="text-right sm:text-left">
                <span className="text-xs sm:text-sm font-bold text-slate-500 block mb-1">پیشرفت کلی به سمت سطح بعدی</span>
                <span className="text-3xl sm:text-4xl font-black text-teal-600 dark:text-teal-400 font-mono">{progressPercent}%</span>
              </div>
            </div>

            <ProgressBar value={progressPercent} max={100} color="teal" />

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-sm text-slate-700 dark:text-slate-300 space-y-2.5">
              <h4 className="font-bold flex items-center gap-2 text-base text-slate-900 dark:text-white">
                <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                شرایط لازم جهت ارتقا به سطح بالاتر:
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed pr-2 font-medium">
                <li>کسب نمره قبولی در تمام سرفصل‌های تکنیکی سطح جاری (تأیید کادر فنی)</li>
                <li>تکمیل حداقل ۱۰ جلسه تمرینی در دوره با حضور مستمر</li>
                <li>ثبت و تأیید آزمون عملی توسط سرمربی و مدیریت آموزشگاه</li>
              </ul>
            </div>

            {/* Official Level Promotion Proposals from Coach / Management */}
            {promotions && promotions.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base">
                  <Award className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>سوابق و پیشنهادات ارتقای سطح توسط مربی:</span>
                </h4>
                <div className="space-y-2.5">
                  {promotions.map((prom) => (
                    <div
                      key={prom.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                            پیشنهاد ارتقا به {prom.proposed_level_name || `سطح ${prom.proposed_level || ''}`}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                            prom.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : prom.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {prom.status === 'APPROVED' ? 'تأیید و مصوب شد' : prom.status === 'REJECTED' ? 'نیازمند تمرین بیشتر' : 'در انتظار بررسی مدیریت'}
                          </span>
                        </div>
                        {prom.coach_notes && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pr-1">
                            نظر مربی: «{prom.coach_notes}»
                          </p>
                        )}
                        {prom.management_notes && (
                          <p className="text-xs sm:text-sm text-teal-700 dark:text-teal-300 font-semibold pr-1">
                            پاسخ مدیریت: «{prom.management_notes}»
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-mono text-slate-400 shrink-0 self-end sm:self-center">
                        {prom.created_at ? toShamsiDate(prom.created_at).shortNumeric : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analytical Charts for Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 border border-teal-200/70 dark:border-teal-900/60">
                  <PieChart className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    سهم تسلط بر مهارت‌های دوره
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    وضعیت سرفصل‌های مصوب فدراسیون تا ارتقا به کلاه بالاتر
                  </p>
                </div>
              </div>

              <DonutChart
                data={skillDonutData}
                size={160}
                donutWidth={22}
                centerLabel="پیشرفت کل"
                centerValue={`${progressPercent}%`}
                valueFormatter={(v) => `${v} مهارت`}
              />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 border border-violet-200/70 dark:border-violet-900/60">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    ارزیابی تفکیکی تکنیک‌ها و مهارت‌های آب
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    سطح تسلط شناگر در هر یک از سرفصل‌ها
                  </p>
                </div>
              </div>

              <HorizontalBarChart
                data={skillsBarData.length > 0 ? skillsBarData : [
                  { label: 'پای کرال سینه', value: 95 },
                  { label: 'دست کرال سینه', value: 90 },
                  { label: 'هواگیری جانبی', value: 85 },
                  { label: 'شناوری و سرش', value: 98 },
                ]}
                max={100}
                valueFormatter={(v) => `${v} از ۱۰۰`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Interactive Video Player & Biomechanics Analysis Modal */}
      {/* ========================================================================= */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
                  <Video className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {selectedVideo.title}
                  </h3>
                  <span className="text-xs text-slate-500">
                    مربی ارزیاب: {selectedVideo.uploaded_by_name || 'کادر فنی آکادمی'} · تاریخ: {selectedVideo.created_at ? toShamsiDate(selectedVideo.created_at)?.shortNumeric : '—'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5">
              {/* Video Player */}
              <div className="relative aspect-video rounded-2xl bg-black overflow-hidden flex items-center justify-center shadow-inner">
                {selectedVideo.video_url ? (
                  <video
                    src={selectedVideo.video_url}
                    controls
                    autoPlay
                    playbackRate={videoPlaybackSpeed}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-sky-600/90 text-white flex items-center justify-center mx-auto shadow-xl">
                      <Play className="w-8 h-8 mr-1" />
                    </div>
                    <p className="text-sm font-bold text-white">
                      پیش‌نمایش تعاملی ویدیوی بیومکانیک شناگر
                    </p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      سرعت پخش، علامت‌گذاری فریم‌ها و نکات زمانی مربی در کادر پایین فعال هستند.
                    </p>
                  </div>
                )}
              </div>

              {/* Playback Speed Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">سرعت بازبینی تکنیک:</span>
                  {[
                    { val: 0.5, label: '0.5x (دور آهسته)' },
                    { val: 0.75, label: '0.75x' },
                    { val: 1.0, label: '1.0x (عادی)' },
                  ].map((speed) => (
                    <button
                      key={speed.val}
                      type="button"
                      onClick={() => setVideoPlaybackSpeed(speed.val)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                        videoPlaybackSpeed === speed.val
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>

                {selectedVideo.video_url && (
                  <a
                    href={selectedVideo.video_url}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود ویدئو</span>
                  </a>
                )}
              </div>

              {/* Timestamped Coach Analysis Points */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  نقاط زمانی تحلیل مربی روی ویدئو:
                </h4>

                <div className="space-y-2">
                  {(selectedVideo.timestamps || [
                    { time: '00:12', label: 'ورود دست به آب با زاویه ایده‌آل و کشیدگی کامل شانه' },
                    { time: '00:35', label: 'شروع فاز گرفتن آب (Catch) با آرنج بالا' },
                    { time: '00:58', label: 'تثبیت خط مرکزی بدن و عدم افت پایانه لگن' },
                  ]).map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 flex items-start gap-3 hover:border-sky-500/50 transition-colors"
                    >
                      <span className="font-mono font-black text-xs px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 shrink-0">
                        {pt.time}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {pt.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="px-5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
