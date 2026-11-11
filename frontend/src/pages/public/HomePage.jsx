import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, PhoneCall,
  CheckCircle2, Clock, MapPin, Check,
  Sparkles, Droplet, ArrowDown, Waves, Users2, Award, CreditCard,
  ArrowUp
} from 'lucide-react';
import {
  SwimmerCrawlIcon,
  SwimmerButterflyIcon,
  SwimmerBreaststrokeIcon,
  OlympicPoolLaneIcon,
  OzonePurificationIcon,
  HydroTherapySpineIcon,
  CardioAquaticIcon,
  OlympicStopwatchIcon,
  RescueBuoyRingIcon,
  SaunaThermalSpaIcon,
  DryLandSwimGymIcon,
  WaterMedalTrophyIcon,
  SynchroSwimIcon,
  PoolStartingBlockIcon,
} from '../../components/common/AquaticIcons';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Carousel } from '../../components/common/Carousel';
import { LoadingState } from '../../components/common/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AquaticPoolBackground } from '../../components/landing/AquaticPoolBackground';
import { AquaticWaveDivider } from '../../components/landing/AquaticWaveDivider';
import { FloatingLandingWaterIcons } from '../../components/landing/FloatingLandingWaterIcons';
import { CoachProfileCard } from '../../components/common/CoachProfileCard';
import { useLandingSections } from '../../context/LandingSectionsContext';
import './HomePage.css';

export const toEnglishDigits = (val) => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
};

// Verified real database records for coaches and news in Qazvin
const INITIAL_COURSES = [
  {
    id: 1,
    name: 'دوره جامع استعدادیابی نخبگان نونهال',
    status: 'ACTIVE',
    sessions_count: 12,
    base_price: 2400000,
    installments_count: 3,
    age_range: 'نونهالان و نوجوانان (6 تا 12 سال)',
    gender: 'ALL',
    gender_display: 'عمومی (دختران و پسران)',
    what_you_learn: 'آزمون‌های فیزیولوژیک درون آب، پیکرسنجی و کشش عضلانی، سنجش توان قلبی‌عروقی و ارزیابی ورود به لیگ باشگاهی',
    groups: [
      { id: 1, name: 'گروه استعدادیابی نونهالان (شنبه و چهارشنبه 16:00)', pool_location: 'استخر نیلگون انقلاب', remaining_capacity: 10 }
    ]
  },
  {
    id: 2,
    name: 'مدرسه شنای نونهالان (آشنایی با آب و رفع ترس)',
    status: 'ACTIVE',
    sessions_count: 10,
    base_price: 1950000,
    installments_count: 2,
    age_range: 'کودکان و خردسالان (4 تا 9 سال)',
    gender: 'ALL',
    gender_display: 'عمومی (دختران و پسران)',
    what_you_learn: 'غلبه بر ترس از آب، اصول تنفس و غوطه‌وری، بازی‌های تعادلی و شناوری، آموزش مقدماتی پا زدن',
    groups: [
      { id: 2, name: 'گروه نونهالان آب‌پری (پنج‌شنبه‌ها 10:00)', pool_location: 'استخر آموزشی سرپوشیده با دمای 31 درجه', remaining_capacity: 5 }
    ]
  },
  {
    id: 3,
    name: 'دوره تخصصی شنای پروانه و استارت قهرمانی',
    status: 'ACTIVE',
    sessions_count: 12,
    base_price: 2800000,
    installments_count: 4,
    age_range: 'نوجوانان و جوانان (12 سال به بالا)',
    gender: 'MALE',
    gender_display: 'پسران / آقایان',
    what_you_learn: 'تکنیک تخصصی موج دلفین، پرتاب دست و تنفس تک‌ضرب پروانه، استارت جهشی از سکو و چرخش‌های سالتو',
    groups: [
      { id: 3, name: 'گروه پیشرفته صبحگاهی (روزهای زوج 08:00)', pool_location: 'استخر قهرمانی آزادی - لاین اختصاصی 2', remaining_capacity: 3 }
    ]
  },
  {
    id: 4,
    name: 'دوره جامع آموزش کرال سینه و استقامت پاییز 1405',
    status: 'ACTIVE',
    sessions_count: 12,
    base_price: 2600000,
    installments_count: 3,
    age_range: 'نوجوانان و بزرگسالان (10 سال به بالا)',
    gender: 'MALE',
    gender_display: 'پسران / آقایان',
    what_you_learn: 'اصلاح تکنیک دست و پای کرال سینه، تنفس ریتمیک دوطرفه، افزایش ظرفیت هوازی و شنای ممتد در لاین طولانی',
    groups: [
      { id: 4, name: 'گروه A (روزهای فرد ساعت 17:00)', pool_location: 'استخر آزادی', remaining_capacity: 12 }
    ]
  },
  {
    id: 5,
    name: 'دوره جامع آموزش کرال سینه و تکنیک تنفس',
    status: 'ACTIVE',
    sessions_count: 12,
    base_price: 2300000,
    installments_count: 3,
    age_range: 'نونهالان و نوجوانان (8 تا 15 سال)',
    gender: 'ALL',
    gender_display: 'عمومی (دختران و پسران)',
    what_you_learn: 'آموزش زاویه اصولی دست کرال، پای منظم با تخته شنا، تنفس منظم دوطرفه و رهاسازی عضلانی در آب',
    groups: [
      { id: 5, name: 'گروه A عصرها (یکشنبه و سه‌شنبه 17:00)', pool_location: 'استخر 50 متری المپیک - لاین 3 و 4', remaining_capacity: 7 }
    ]
  }
];

const INITIAL_COACHES = [
  {
    id: 1,
    full_name: 'محمد رضایی',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    specialties: 'کرال سینه، شنای پروانه، نجات غریق درجه ۱',
    bio: 'مربی رسمی فدراسیون شنا با ۱۰ سال سابقه آموزش تیم‌های پایه و استعدادیابی در استخرهای قزوین',
    icon: SwimmerCrawlIcon,
  },
  {
    id: 4,
    full_name: 'نیما سعادتی',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    specialties: 'شنای قورباغه، اصلاح تکنیک و استارت',
    bio: 'مربی تخصصی اصلاح حرکت، استارت و استقامت بدنی شناگران در رده‌های نوجوانان و جوانان قزوین',
    icon: PoolStartingBlockIcon,
  },
  {
    id: 2,
    full_name: 'علیرضا مرادی (مربی)',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80',
    specialties: 'کرال سینه، شنای پروانه، نجات غریق',
    bio: 'مربی رسمی فدراسیون شنا با ۱۲ سال سابقه تدریس شنای مبتدی و پیشرفته برای کودکان و بزرگسالان در قزوین',
    icon: RescueBuoyRingIcon,
  },
  {
    id: 3,
    full_name: 'سارا کاظمی',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
    specialties: 'آموزش بانوان و کودکان، آب‌درمانی و کرال پشت',
    bio: 'مدرس رسمی فدراسیون و کارشناس تربیت بدنی با سابقه ۱۰ سال برگزاری کلاس‌های آموزش شنای بانوان در قزوین',
    icon: SynchroSwimIcon,
  },
  {
    id: 5,
    full_name: 'مهدی یزدانی',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80',
    specialties: 'استعدادیابی نونهالان، آب‌بازی و رفع ترس از آب',
    bio: 'مربی باحوصله و مجرب در حوزه آموزش اصولی شنا از پایه برای رده‌های سنی ۵ تا ۱۲ سال',
    icon: WaterMedalTrophyIcon,
  },
];

const INITIAL_NEWS = [
  {
    id: 1,
    title: 'آغاز ثبت‌نام دوره‌های جدید آموزش شنا در استخرهای قزوین',
    category: 'CLASSES',
    category_display: 'دوره‌ها و کلاس‌ها',
    summary: 'ثبت‌نام ترم جدید کلاس‌های آموزش ۴ شنا ویژه کودکان، نوجوانان و بزرگسالان آغاز شد.',
    body: 'علاقه‌مندان می‌توانند برای انتخاب تایم کلاس‌ها و تعیین سطح اولیه، از طریق سامانه یا با هماهنگی تلفنی اقدام نمایند.',
    publish_at: '2026-10-25T12:49:27.601522+00:00',
  },
  {
    id: 2,
    title: 'برگزاری برنامه استعدادیابی شنای نونهالان استان قزوین',
    category: 'COMPETITIONS',
    category_display: 'استعدادیابی',
    summary: 'طرح شناسایی استعدادهای برتر شنا در رده‌های سنی ۶ تا ۱۲ سال با حضور مربیان رسمی فدراسیون برگزار گردید.',
    body: 'این ارزیابی با هدف جذب نونهالان مستعد جهت آموزش اصولی تکنیک‌های پایه و آماده‌سازی برای مسابقات استانی انجام شد.',
    publish_at: '2026-10-22T16:35:12.990003+00:00',
  },
  {
    id: 3,
    title: 'راهنمای والدین: راهکارهای رفع ترس از آب در کودکان خردسال',
    category: 'HEALTH',
    category_display: 'آموزش و مشاوره',
    summary: 'چگونه می‌توان با آب‌بازی و محیط آرام، تجربه اولین جلسات شنا را برای کودک لذت‌بخش و خاطره‌انگیز کرد.',
    body: 'روانشناسی آموزش شنا به کودکان نشان می‌دهد همراهی صبورانه مربی و پرهیز از اجبار، مهم‌ترین عامل در علاقه پایدار کودک به شنا است.',
    publish_at: '2026-10-18T16:35:12.997702+00:00',
  },
  {
    id: 4,
    title: 'نکات بهداشتی استخرها و مراقبت از چشم و پوست کودکان',
    category: 'HEALTH',
    category_display: 'بهداشت و سلامت',
    summary: 'توصیه‌های مهم مربیان درباره استفاده از عینک و کلاه شنای استاندارد و دوش گرفتن قبل و بعد از تمرین.',
    body: 'رعایت اصول بهداشت فردی و شستشوی مناسب بعد از استخر، از خشکی پوست و خستگی جلوگیری می‌کند.',
    publish_at: '2026-10-15T16:35:13.005472+00:00',
  },
];

const INITIAL_POOLS = [
  {
    id: 1,
    name: 'استخر ۵۰ متری المپیک قزوین',
    slug: 'olympic-pool-qazvin',
    poster_image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
    location: 'قزوین، شهرک کوثر، مجتمع ورزشی المپیک',
    description: 'مجموعه آبی المپیک مجهز به استخر مسابقاتی ۵۰ متری با ۱۰ خط، استاندارد برگزاری مسابقات رسمی فدراسیون شنا، سیستم پیشرفته گندزدایی ترکیبی ازن و کلر با کمترین میزان بوی گاز، آب زلال و مطبوع با عمق استاندارد.',
    facilities: 'استخر ۵۰ متری المپیک، سونای خشک و بخار فنلاندی، جکوزی ماساژوردار، حوضچه آب سرد، رختکن الکترونیک و پارکینگ اختصاصی',
    dimensions: '۵۰ در ۲۵ متر (۱۰ لاین مسابقاتی)',
    depth: '۱.۴۰ الی ۳.۸۰ متر',
    phone: '۰۲۸-۳۳۶۵۲۰۰۱',
    gallery_images: [
      { id: 101, image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80' },
      { id: 102, image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=800&q=80' },
      { id: 103, image: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  {
    id: 2,
    name: 'استخر نیلگون انقلاب',
    slug: 'nilgoon-enghelab-pool',
    poster_image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=800&q=80',
    location: 'قزوین، میدان میرعماد، خیابان نادری شمالی',
    description: 'مرکز تخصصی آموزش ۴ شنا و رفع ترس کودکان با محیط بسیار تمیز و آب زلال و مطبوع ۳۰ درجه. محیطی آرام و استاندارد ویژه بانوان، کودکان و نوآموزان.',
    facilities: 'کاسه آموزشی اختصاصی، سونای بخار گیاهی، جکوزی ماساژوردار، بوفه سلامت و نجات غریق‌های مقیم فدراسیون',
    dimensions: '۲۵ در ۱۲.۵ متر (۶ لاین)',
    depth: '۰.۹۰ الی ۲.۲۰ متر',
    phone: '۰۲۸-۳۳۳۴۱۰۰۲',
    gallery_images: [
      { id: 201, image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=800&q=80' },
      { id: 202, image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  {
    id: 3,
    name: 'استخر قهرمانی آزادی',
    slug: 'azadi-championship-pool',
    poster_image: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80',
    location: 'قزوین، سبزه میدان، مجموعه ورزشی جهان پهلوان تختی',
    description: 'پایگاه استعدادیابی و تمرینات تیم‌های منتخب شنای استان قزوین، مجهز به تجهیزات پیشرفته ثبت رکورد و تایم‌گیری دیجیتال و خطوط مجهز به طناب موج‌گیر.',
    facilities: 'لاین‌های اختصاصی تمرین سرعتی، تخته‌های شنا و فین، سالن بدنسازی خشک ویژه شناگران، سونای خشک',
    dimensions: '۳۳ در ۱۵ متر',
    depth: '۱.۲۰ الی ۲.۸۰ متر',
    phone: '۰۲۸-۳۳۲۲۳۳۴۴',
    gallery_images: [
      { id: 301, image: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80' }
    ]
  },
  {
    id: 4,
    name: 'استخر آموزشی سرپوشیده نونهالان (آب‌پری)',
    slug: 'abpari-kids-pool',
    poster_image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80',
    location: 'قزوین، بلوار دانشگاه، مجتمع آموزشی ورزشی دانشگاه',
    description: 'استخر ویژه کودکان و نونهالان با دمای کنترل‌شده ۳۱ درجه و سیستم بدون کلر شیمیایی جهت جلوگیری از هرگونه سوزش چشم یا حساسیت تنفسی نوآموزان.',
    facilities: 'کاسه شیب‌دار ایمن کودکان، بازوبند و نودل‌های فومی آلمانی، دوش‌های آبگرم اختصاصی کودکان و اتاق انتظار شیشه‌ای والدین',
    dimensions: '۱۶ در ۸ متر',
    depth: '۰.۷۰ الی ۱.۲۰ متر',
    phone: '۰۲۸-۳۳۵۵۶۶۷۷',
    gallery_images: [
      { id: 401, image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80' }
    ]
  }
];

const getCourseDetails = (course) => {
  // 1. Age Range (رده سنی)
  let ageRange = course.age_range;
  if (!ageRange) {
    const name = course.name || '';
    if (name.includes('نونهال') || name.includes('کودک')) {
      ageRange = 'کودکان و نونهالان (6 تا 12 سال)';
    } else if (name.includes('پروانه') || name.includes('قهرمانی')) {
      ageRange = 'نوجوانان و جوانان (12 سال به بالا)';
    } else if (name.includes('استقامت') || name.includes('پاییز')) {
      ageRange = 'نوجوانان و بزرگسالان (10 سال به بالا)';
    } else {
      ageRange = 'عموم رده‌های سنی (8 تا 16 سال)';
    }
  }

  // 2. Gender (جنسیت)
  let gender = course.gender_display;
  if (!gender) {
    if (course.gender === 'FEMALE') {
      gender = 'دختران / بانوان';
    } else {
      const name = course.name || '';
      if (name.includes('بانوان') || name.includes('دختر')) {
        gender = 'دختران / بانوان';
      } else {
        gender = 'پسران / آقایان';
      }
    }
  }

  // 3. What they teach (چیزی که یاد میدن)
  let whatYouLearn = course.what_you_learn;
  if (!whatYouLearn) {
    const name = course.name || '';
    if (name.includes('پروانه')) {
      whatYouLearn = 'تکنیک تخصصی موج دلفین، پرتاب دست و تنفس تک‌ضرب پروانه، استارت جهشی از سکو و سالتو';
    } else if (name.includes('نونهال') && name.includes('ترس')) {
      whatYouLearn = 'غلبه بر ترس از آب، اصول تنفس و غوطه‌وری، بازی‌های تعادلی و شناوری، آموزش مقدماتی پا زدن';
    } else if (name.includes('استعدادیابی')) {
      whatYouLearn = 'آزمون‌های فیزیولوژیک درون آب، پیکرسنجی و کشش عضلانی، سنجش توان قلبی و ارزیابی ورود به لیگ';
    } else if (name.includes('کرال سینه') && name.includes('استقامت')) {
      whatYouLearn = 'اصلاح تکنیک دست و پای کرال سینه، تنفس ریتمیک دوطرفه، افزایش ظرفیت هوازی و شنای ممتد در لاین طولانی';
    } else if (name.includes('کرال سینه') && name.includes('تنفس')) {
      whatYouLearn = 'آموزش زاویه اصولی دست کرال، پای منظم با تخته شنا، تنفس منظم دوطرفه و رهاسازی عضلانی در آب';
    } else if (course.description) {
      whatYouLearn = course.description;
    } else {
      whatYouLearn = 'آموزش اصولی تکنیک‌های پایه شنا، هماهنگی تنفس و دست و پا، و غوطه‌وری ایمن';
    }
  }

  return {
    ageRange: toEnglishDigits(ageRange),
    gender,
    whatYouLearn: toEnglishDigits(whatYouLearn),
  };
};

const getCourseScheduleAndCapacity = (course) => {
  const group = course.groups?.[0];
  if (!group) return { schedule: null, capacity: null };

  let schedule = null;
  if (Array.isArray(group.schedules) && group.schedules.length > 0) {
    schedule = group.schedules
      .map((s) => `${s.weekday_display || ''} ${s.start_time ? s.start_time.slice(0, 5) : ''}`.trim())
      .filter(Boolean)
      .join('، ');
  } else if (group.name && group.name.includes('(') && group.name.includes(')')) {
    const match = group.name.match(/\(([^)]+)\)/);
    if (match) schedule = match[1];
  }

  const capacity = typeof group.remaining_capacity === 'number'
    ? group.remaining_capacity
    : null;

  return {
    schedule: toEnglishDigits(schedule),
    capacity: capacity !== null ? toEnglishDigits(capacity) : null,
  };
};

export const HomePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isSectionEnabled, sections: landingSections } = useLandingSections();
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseFilter, setCourseFilter] = useState('ALL'); // 'ALL' | 'KIDS' | 'TEENS' | 'INSTALLMENTS'
  const [coaches, setCoaches] = useState(INITIAL_COACHES);
  const [coachGenderTab, setCoachGenderTab] = useState('ALL'); // 'ALL' | 'MALE' | 'FEMALE'
  const [news, setNews] = useState(INITIAL_NEWS);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showRaybanModal, setShowRaybanModal] = useState(false);
  const [pools, setPools] = useState(INITIAL_POOLS);
  const [selectedPool, setSelectedPool] = useState(null);

  // Course Enrollment Request State
  const [enrollingCourse, setEnrollingCourse] = useState(null);
  const [enrollForm, setEnrollForm] = useState({
    applicant_name: '',
    applicant_phone: '',
    applicant_national_id: '',
    selected_installments: 1,
    notes: '',
  });
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);

  const handleOpenEnroll = (course) => {
    setEnrollingCourse(course);
    setEnrollForm({
      applicant_name: user?.full_name || '',
      applicant_phone: user?.phone || '',
      applicant_national_id: user?.national_id || '',
      selected_installments: 1,
      notes: '',
    });
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollingCourse) return;
    if (!enrollForm.applicant_name.trim() || !enrollForm.applicant_phone.trim()) {
      toast.error('لطفاً نام و شماره همراه متقاضی را وارد کنید.');
      return;
    }
    try {
      setEnrollSubmitting(true);
      await api.post('/education/requests/submit/', {
        course: enrollingCourse.id,
        applicant_name: enrollForm.applicant_name.trim(),
        applicant_phone: enrollForm.applicant_phone.trim(),
        applicant_national_id: enrollForm.applicant_national_id.trim(),
        selected_installments: Number(enrollForm.selected_installments) || 1,
        notes: enrollForm.notes,
      });
      toast.success(
        `درخواست ثبت‌نام شما در دوره ${enrollingCourse.name} با شیوه پرداخت (${enrollForm.selected_installments > 1 ? `${enrollForm.selected_installments} قسط` : 'یکجا'}) با موفقیت ثبت شد.`
      );
      setEnrollingCourse(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'خطا در ثبت درخواست');
    } finally {
      setEnrollSubmitting(false);
    }
  };

  // Auto-scroll for core benefit cards on mobile & tablet without play/pause buttons
  const benefitsTrackRef = useRef(null);
  const activeBenefitIndexRef = useRef(0);
  const [activeBenefitDot, setActiveBenefitDot] = useState(0);
  const isBenefitInteractingRef = useRef(false);
  const isBenefitVisibleRef = useRef(false);
  const benefitTimeoutRef = useRef(null);

  // Only auto-scroll when the cards section is visible on screen
  useEffect(() => {
    const track = benefitsTrackRef.current;
    if (!track || typeof IntersectionObserver === 'undefined') {
      isBenefitVisibleRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isBenefitVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.15 }
    );

    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = benefitsTrackRef.current;
    if (!track) return;

    const intervalId = setInterval(() => {
      // 1. NEVER scroll if user is elsewhere on the page (cards not in viewport)
      if (!isBenefitVisibleRef.current) return;

      // 2. Don't auto-scroll if user is currently interacting
      if (isBenefitInteractingRef.current) return;

      // 3. On desktop (grid layout where all cards fit), do not scroll
      if (track.scrollWidth <= track.clientWidth + 20) return;

      const cards = Array.from(track.children);
      if (!cards || cards.length <= 1) return;

      const nextIndex = (activeBenefitIndexRef.current + 1) % cards.length;
      activeBenefitIndexRef.current = nextIndex;
      setActiveBenefitDot(nextIndex);

      const targetCard = cards[nextIndex];
      if (targetCard) {
        const trackRect = track.getBoundingClientRect();
        const cardRect = targetCard.getBoundingClientRect();
        const delta = (cardRect.left + cardRect.width / 2) - (trackRect.left + trackRect.width / 2);
        track.scrollBy({
          left: delta,
          behavior: 'smooth',
        });
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  const scrollToBenefit = (index) => {
    const track = benefitsTrackRef.current;
    if (!track) return;
    const cards = Array.from(track.children);
    const card = cards[index];
    if (!card) return;

    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta = (cardRect.left + cardRect.width / 2) - (trackRect.left + trackRect.width / 2);
    track.scrollBy({ left: delta, behavior: 'smooth' });
    setActiveBenefitDot(index);
    activeBenefitIndexRef.current = index;
    handleBenefitInteractionStart();
  };

  const handleBenefitInteractionStart = () => {
    isBenefitInteractingRef.current = true;
    if (benefitTimeoutRef.current) {
      clearTimeout(benefitTimeoutRef.current);
    }
    // Auto-resume after 3.5s in case touch doesn't fire mouseleave on tablet
    benefitTimeoutRef.current = setTimeout(() => {
      isBenefitInteractingRef.current = false;
    }, 3500);
  };

  const handleBenefitInteractionEnd = () => {
    if (benefitTimeoutRef.current) {
      clearTimeout(benefitTimeoutRef.current);
    }
    benefitTimeoutRef.current = setTimeout(() => {
      isBenefitInteractingRef.current = false;
    }, 3500);
  };

  const handleBenefitScroll = () => {
    const track = benefitsTrackRef.current;
    if (!track) return;
    const cards = Array.from(track.children);
    if (!cards || cards.length === 0) return;

    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestIndex = 0;
    let minDiff = Infinity;

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const diff = Math.abs(trackCenter - cardCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    activeBenefitIndexRef.current = closestIndex;
    setActiveBenefitDot(closestIndex);
  };

  // Facilities smooth scroll tracking for mobile
  const facilitiesTrackRef = useRef(null);
  const [activeFacilityDot, setActiveFacilityDot] = useState(0);

  const handleFacilityScroll = () => {
    const track = facilitiesTrackRef.current;
    if (!track) return;
    const cards = Array.from(track.children);
    if (!cards || cards.length === 0) return;

    const trackRect = track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    let closestIndex = 0;
    let minDiff = Infinity;

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const diff = Math.abs(trackCenter - cardCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    setActiveFacilityDot(closestIndex);
  };

  const scrollToFacility = (index) => {
    const track = facilitiesTrackRef.current;
    if (!track) return;
    const cards = Array.from(track.children);
    const card = cards[index];
    if (!card) return;

    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta = (cardRect.left + cardRect.width / 2) - (trackRect.left + trackRect.width / 2);
    track.scrollBy({ left: delta, behavior: 'smooth' });
    setActiveFacilityDot(index);
  };



  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [courseRes, coachRes, nRes, poolRes] = await Promise.allSettled([
          api.get('/education/courses/'),
          api.get('/coaches/'),
          api.get('/content/news/'),
          api.get('/content/pools/'),
        ]);
        if (courseRes.status === 'fulfilled' && courseRes.value?.data) {
          const courseData = courseRes.value.data.results || courseRes.value.data;
          if (Array.isArray(courseData) && courseData.length > 0) setCourses(courseData);
        }
        if (coachRes.status === 'fulfilled' && coachRes.value?.data) {
          const cData = coachRes.value.data.results || coachRes.value.data;
          if (Array.isArray(cData) && cData.length > 0) {
            const sorted = [...cData].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
            setCoaches(sorted);
          }
        }
        if (nRes.status === 'fulfilled' && nRes.value?.data) {
          const nData = nRes.value.data.results || nRes.value.data;
          if (Array.isArray(nData) && nData.length > 0) setNews(nData);
        }
        if (poolRes.status === 'fulfilled' && poolRes.value?.data) {
          const pData = poolRes.value.data.results || poolRes.value.data;
          if (Array.isArray(pData) && pData.length > 0) setPools(pData);
        }
      } catch (err) {
        console.error('Error updating live landing data:', err);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  // Professional portraits curated for each coach
  const getCoachAvatar = (coach) => {
    if (coach?.avatar) return coach.avatar;
    if (coach?.profile_image) return coach.profile_image;
    if (coach?.image) return coach.image;
    if (coach?.photo) return coach.photo;
    const name = coach?.full_name || '';
    if (name.includes('سارا')) {
      return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('نیما')) {
      return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('علیرضا')) {
      return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('مهدی')) {
      return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80';
    }
    if (name.includes('رضایی') || name.includes('محمد')) {
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80';
    }
    return null;
  };

  const getCoachSpecialtyIcon = (coach) => {
    const name = coach?.full_name || '';
    const spec = (coach?.specialties || '').toLowerCase();
    if (name.includes('سارا') || spec.includes('موزون') || spec.includes('آب‌درمانی')) return SynchroSwimIcon;
    if (name.includes('نیما') || spec.includes('استارت') || spec.includes('سرعتی')) return PoolStartingBlockIcon;
    if (name.includes('علیرضا') || spec.includes('نجات') || spec.includes('غریق')) return RescueBuoyRingIcon;
    if (name.includes('مهدی') || spec.includes('نونهالان') || spec.includes('استعدادیابی')) return WaterMedalTrophyIcon;
    if (spec.includes('پروانه')) return SwimmerButterflyIcon;
    if (spec.includes('قورباغه')) return SwimmerBreaststrokeIcon;
    return SwimmerCrawlIcon;
  };

  const isFemaleCoach = (c) => {
    if (c.gender === 'FEMALE') return true;
    if (c.gender === 'MALE') return false;
    const name = c.full_name || '';
    return name.includes('سارا') || name.includes('مریم') || name.includes('زهرا') || name.includes('خانم');
  };

  const isMaleCoach = (c) => !isFemaleCoach(c);

  const filteredCoaches = coaches
    .filter((c) => {
      if (coachGenderTab === 'MALE') return isMaleCoach(c);
      if (coachGenderTab === 'FEMALE') return isFemaleCoach(c);
      return true;
    })
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

  const filteredCourses = courses.filter((c) => {
    if (courseFilter === 'ALL') return true;
    const text = `${c.name || ''} ${c.age_range || ''}`;
    if (courseFilter === 'KIDS') {
      return text.includes('کودک') || text.includes('نونهال') || text.includes('خردسال');
    }
    if (courseFilter === 'TEENS') {
      return text.includes('نوجوان') || text.includes('جوانان') || text.includes('بزرگسال');
    }
    if (courseFilter === 'INSTALLMENTS') {
      return (c.installments_count || 1) > 1;
    }
    return true;
  });

  const courseCategories = [
    { id: 'ALL', label: 'همه دوره‌ها', count: courses.length },
    {
      id: 'KIDS',
      label: 'کودکان و نونهالان',
      count: courses.filter((c) => {
        const text = `${c.name || ''} ${c.age_range || ''}`;
        return text.includes('کودک') || text.includes('نونهال') || text.includes('خردسال');
      }).length,
    },
    {
      id: 'TEENS',
      label: 'نوجوانان و بزرگسالان',
      count: courses.filter((c) => {
        const text = `${c.name || ''} ${c.age_range || ''}`;
        return text.includes('نوجوان') || text.includes('جوانان') || text.includes('بزرگسال');
      }).length,
    },
    {
      id: 'INSTALLMENTS',
      label: 'دوره‌های اقساطی',
      count: courses.filter((c) => (c.installments_count || 1) > 1).length,
    },
  ];

  const getNewsImage = (item, index) => {
    if (item?.image_url) return item.image_url;
    if (item?.image) return item.image;
    const cat = item?.category;
    if (cat === 'COMPETITIONS') {
      return 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80';
    }
    if (cat === 'HEALTH') {
      return 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';
    }
    if (cat === 'CLASSES') {
      return index % 2 === 0
        ? 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=800&q=80';
  };

  const getNewsCategoryIcon = (category) => {
    switch (category) {
      case 'COMPETITIONS': return OlympicStopwatchIcon;
      case 'CLASSES': return OlympicPoolLaneIcon;
      case 'HEALTH': return OzonePurificationIcon;
      case 'GENERAL':
      default: return WaterMedalTrophyIcon;
    }
  };

  const formatPersianDateString = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getDashboardDestination = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'COACH': return '/coach';
      case 'SUPERVISOR': return '/supervisor';
      case 'SWIMMER': return '/swimmer';
      default: return '/';
    }
  };

  const renderHeroFeatureCards = () => (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 items-stretch w-full">
        <div className="hero-feature-card w-full p-2.5 sm:p-3 lg:p-4 rounded-2xl bg-white/95 border-2 border-cyan-100/90 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-start gap-1.5 hover:shadow-lg transition-all h-full">
          <div className="hero-feature-header flex items-center gap-1.5 text-black text-xs sm:text-sm lg:text-[14px] font-black whitespace-nowrap">
            <Waves className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="hero-feature-title font-black text-black whitespace-nowrap">آموزش ۴ شنا</span>
          </div>
          <p className="hero-feature-desc text-xs sm:text-[13px] text-slate-800 font-semibold leading-snug sm:leading-relaxed">کرال سینه، پشت، قورباغه و پروانه</p>
        </div>

        <div className="hero-feature-card w-full p-2.5 sm:p-3 lg:p-4 rounded-2xl bg-white/95 border-2 border-cyan-100/90 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-start gap-1.5 hover:shadow-lg transition-all h-full">
          <div className="hero-feature-header flex items-center gap-1.5 text-black text-xs sm:text-sm lg:text-[14px] font-black whitespace-nowrap">
            <Award className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="hero-feature-title font-black text-black whitespace-nowrap">مربیان رسمی</span>
          </div>
          <p className="hero-feature-desc text-xs sm:text-[13px] text-slate-800 font-semibold leading-snug sm:leading-relaxed">دارای کارت مربیگری و نجات‌غریق</p>
        </div>

        <div className="hero-feature-card w-full p-2.5 sm:p-3 lg:p-4 rounded-2xl bg-white/95 border-2 border-cyan-100/90 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-start gap-1.5 hover:shadow-lg transition-all h-full">
          <div className="hero-feature-header flex items-center gap-1.5 text-black text-xs sm:text-sm lg:text-[14px] font-black whitespace-nowrap">
            <Users2 className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="hero-feature-title font-black text-black whitespace-nowrap">کودکان و بزرگسالان</span>
          </div>
          <p className="hero-feature-desc text-xs sm:text-[13px] text-slate-800 font-semibold leading-snug sm:leading-relaxed">از ۵ سال تا رده‌های بزرگسال</p>
        </div>

        <div className="hero-feature-card w-full p-2.5 sm:p-3 lg:p-4 rounded-2xl bg-white/95 border-2 border-cyan-100/90 shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col justify-start gap-1.5 hover:shadow-lg transition-all h-full">
          <div className="hero-feature-header flex items-center gap-1.5 text-black text-xs sm:text-sm lg:text-[14px] font-black whitespace-nowrap">
            <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="hero-feature-title font-black text-black whitespace-nowrap">استخرهای قزوین</span>
          </div>
          <p className="hero-feature-desc text-xs sm:text-[13px] text-slate-800 font-semibold leading-snug sm:leading-relaxed">محیط تمیز، بهداشتی و ایمن</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="landing-experience relative min-h-screen selection:bg-cyan-200 selection:text-slate-900 overflow-x-hidden text-right font-sans">
      {/* Dynamic Aquatic Water Caustic Canvas */}
      <AquaticPoolBackground />

      {/* Main Content Layers */}
      <div className="relative z-20 w-full">
        
        {/* =========================================================================
            SECTION 1: CINEMATIC AQUATIC HERO & WATER ENTRY ARENA
            ========================================================================= */}
        {isSectionEnabled('hero') && (
          <>
            <section className="landing-hero relative w-full pt-8 sm:pt-14 lg:pt-18 pb-12 sm:pb-16 min-w-0">
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <div className="landing-hero__panel relative w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Text & Primary Actions */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-right">
                
                {/* Floating Aquatic Pill */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/95 border-2 border-cyan-200/90 rounded-full text-xs sm:text-sm font-bold text-slate-900 shadow-md">
                  <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>مدرسه شنای ایران • استان قزوین</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
                </div>

                {/* Main Headline */}
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl md:text-[1.85rem] lg:text-[2.6rem] xl:text-5xl font-black tracking-tight leading-[1.25] text-white">
                    <span>آموزش اصولی شنا</span>{' '}
                    <br className="block md:hidden" />
                    <span className="text-cyan-300 font-black">
                      از مبتدی تا پیشرفته
                    </span>
                  </h1>
                  <p className="hero-lead-text text-base sm:text-xl font-bold text-sky-100 leading-snug">
                    دوره‌های آموزش شنا ویژه کودکان، نوجوانان و بزرگسالان زیر نظر مربیان رسمی فدراسیون شنا
                  </p>
                </div>

                {/* Editorial Description */}
                <p className="hero-editorial-p text-sm sm:text-base lg:text-lg text-slate-100/90 leading-relaxed font-normal max-w-2xl text-justify">
                  اگر به دنبال یادگیری اصولی شنا، رفع ترس از آب در کودکان یا آموزش چهار شنا (کرال سینه، کرال پشت، قورباغه و پروانه) هستید؛ کلاس‌های ما در استخرهای منتخب قزوین در محیطی بهداشتی، خلوت و با برنامه‌ریزی منظم برگزار می‌شود.
                </p>

                {/* Primary Conversion & Navigation Buttons */}
                <div className="flex flex-row items-center gap-2.5 sm:gap-4 pt-3 w-full sm:w-auto">
                  {user ? (
                    <Link
                      to={getDashboardDestination()}
                      className="flex-1 sm:flex-initial justify-center px-4 sm:px-7 py-3.5 sm:py-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black rounded-2xl shadow-[0_8px_20px_-4px_rgba(34,211,238,0.5)] hover:shadow-cyan-400/60 transition-all text-xs sm:text-base inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 text-center whitespace-nowrap"
                    >
                      <span>ورود به پنل کاربری</span>
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </Link>
                  ) : (
                    <Link
                      to="/login?mode=register"
                      className="flex-1 sm:flex-initial justify-center px-4 sm:px-7 py-3.5 sm:py-4 bg-cyan-300 hover:bg-cyan-200 text-slate-950 font-black rounded-2xl shadow-[0_8px_20px_-4px_rgba(34,211,238,0.5)] hover:shadow-cyan-400/60 transition-all text-xs sm:text-base inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 text-center whitespace-nowrap"
                    >
                      <span>ثبت‌نام در کلاس‌ها</span>
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </Link>
                  )}

                  <a
                    href="#courses"
                    className="flex-1 sm:flex-initial justify-center px-4 sm:px-6 py-3.5 sm:py-4 bg-white hover:bg-cyan-50 text-slate-950 font-black rounded-2xl border-2 border-cyan-200/80 shadow-[0_8px_20px_-4px_rgba(255,255,255,0.4)] hover:shadow-white/60 transition-all text-xs sm:text-base inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 text-center whitespace-nowrap"
                  >
                    <Waves className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 shrink-0" />
                    <span>مشاهده دوره‌ها و کلاس‌ها</span>
                  </a>
                </div>

                {/* Desktop Only: Key Metric Features */}
                <div className="hidden lg:block pt-6 border-t border-cyan-300/40">
                  {renderHeroFeatureCards()}
                </div>

              </div>

              {/* Swimmer Boy Hero Mascot */}
              <div className="lg:col-span-5 relative flex items-center justify-center">
                <div className="relative w-full max-w-sm sm:max-w-md flex items-center justify-center py-4">
                  {/* Subtle aquatic glow behind the swimmer */}
                  <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

                  <picture>
                    <source srcSet="/images/swimmer-boy.webp" type="image/webp" />
                    <img
                      src="/images/swimmer-boy.webp"
                      alt="آموزشگاه شنای ایران - آموزش و استعدادیابی شنا"
                      className="hero-swimmer-boy relative z-10 w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[420px] h-auto object-contain select-none drop-shadow-[0_20px_35px_rgba(2,22,35,0.65)] hover:scale-105 transition-transform duration-500"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </picture>
                </div>
              </div>

              {/* Mobile & Tablet Only: Key Metric Features (under swimmer boy, 2x2 on mobile, 4-col on tablet) */}
              <div className="block lg:hidden col-span-1 w-full pt-2 sm:pt-4 border-t border-cyan-300/30">
                {renderHeroFeatureCards()}
              </div>

            </div>
          </div>
        </div>
        </section>

        {/* Organic Wave Transition: Hero to Benefits */}
        <AquaticWaveDivider topColor="#cbeff5" bottomColor="#d4f4eb" flip={false} />
      </>
    )}

      {/* =========================================================================
          SECTION 2: REAL CORE BENEFITS
          ========================================================================= */}
      {isSectionEnabled('about') && (
        <>
          <section id="about" className="relative w-full py-12 sm:py-16 lg:py-20 min-w-0">
        <FloatingLandingWaterIcons section="about" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="info">ویژگی‌های کلاس‌های ما</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              چرا مدرسه شنای ایران؟
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              آموزش شنا با صبر و حوصله، متناسب با روحیات نوآموزان و با بالاترین استانداردهای ایمنی
            </p>
          </div>

          <div
            ref={benefitsTrackRef}
            onMouseEnter={handleBenefitInteractionStart}
            onMouseLeave={handleBenefitInteractionEnd}
            onTouchStart={handleBenefitInteractionStart}
            onTouchEnd={handleBenefitInteractionEnd}
            onScroll={handleBenefitScroll}
            className="landing-benefits-track landing-scroll-track flex overflow-x-auto pt-4 pb-4 px-4 sm:pt-5 sm:pb-6 sm:px-6 gap-6 sm:gap-8 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:pt-5 lg:pb-6 lg:px-7 items-stretch"
          >
            {/* Benefit Card 1 - فیروزه‌ای پودری */}
            <div className="benefit-card benefit-card--turquoise card-hydrofoil group relative flex flex-col justify-between w-[84vw] sm:w-[350px] md:w-[350px] max-w-[360px] shrink-0 snap-center lg:w-auto lg:max-w-none lg:shrink h-full">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
                <div className="benefit-card__icon w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CardioAquaticIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <span className="benefit-card__badge px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap">
                  کودکان و نوجوانان
                </span>
              </div>
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <h3 className="benefit-card__title font-black text-lg sm:text-xl lg:text-[1.2rem] xl:text-[1.35rem] whitespace-nowrap tracking-tight leading-snug" title="آموزش بدون ترس و روان‌شناختی">
                  آموزش بدون ترس و روان‌شناختی
                </h3>
                <p className="benefit-card__desc text-sm sm:text-base leading-relaxed sm:leading-loose text-justify font-medium flex-1 pt-1">
                  شروع از بازی‌های شاداب در آب کم‌عمق تا کودک احساس امنیت کامل کند و با انگیزه و علاقه واقعی مراحل یادگیری شنا را پشت سر بگذارد.
                </p>
              </div>
              <div className="benefit-card__footer mt-5 pt-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
                <span>محیط شاداب و امن برای کودک</span>
                <Check className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </div>
            </div>

            {/* Benefit Card 2 - بنفش ملو پودری */}
            <div className="benefit-card benefit-card--purple card-hydrofoil group relative flex flex-col justify-between w-[84vw] sm:w-[350px] md:w-[350px] max-w-[360px] shrink-0 snap-center lg:w-auto lg:max-w-none lg:shrink h-full">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
                <div className="benefit-card__icon w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <HydroTherapySpineIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <span className="benefit-card__badge px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap">
                  اصلاح ساختار قامت و تنفس
                </span>
              </div>
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <h3 className="benefit-card__title font-black text-lg sm:text-xl lg:text-[1.2rem] xl:text-[1.35rem] whitespace-nowrap tracking-tight leading-snug" title="تقویت ستون فقرات و سلامت جسمانی">
                  تقویت ستون فقرات و سلامت جسمانی
                </h3>
                <p className="benefit-card__desc text-sm sm:text-base leading-relaxed sm:leading-loose text-justify font-medium flex-1 pt-1">
                  شنا بهترین ورزش برای جلوگیری از افتادگی شانه و گودی کمر در کودکان محصل است و در بزرگسالان به بهبود تنفس و کاهش دردهای عضلانی کمک می‌کند.
                </p>
              </div>
              <div className="benefit-card__footer mt-5 pt-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
                <span>بهبود استقامت و سلامت بدنی</span>
                <Check className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </div>
            </div>

            {/* Benefit Card 3 - سبز پودری */}
            <div className="benefit-card benefit-card--green card-hydrofoil group relative flex flex-col justify-between w-[84vw] sm:w-[350px] md:w-[350px] max-w-[360px] shrink-0 snap-center lg:w-auto lg:max-w-none lg:shrink h-full">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
                <div className="benefit-card__icon w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <RescueBuoyRingIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <span className="benefit-card__badge px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap">
                  نظارت و ایمنی کامل
                </span>
              </div>
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <h3 className="benefit-card__title font-black text-lg sm:text-xl lg:text-[1.2rem] xl:text-[1.35rem] whitespace-nowrap tracking-tight leading-snug" title="مربیان رسمی و کلاس‌های کم‌جمعیت">
                  مربیان رسمی و کلاس‌های کم‌جمعیت
                </h3>
                <p className="benefit-card__desc text-sm sm:text-base leading-relaxed sm:leading-loose text-justify font-medium flex-1 pt-1">
                  آموزش توسط مربیان دارای کارت رسمی فدراسیون در گروه‌های خلوت و با حضور پیوسته نجات‌غریق برگزار می‌شود تا پیشرفت هر شناگر به طور اختصاصی پایش شود.
                </p>
              </div>
              <div className="benefit-card__footer mt-5 pt-3.5 flex items-center justify-between text-xs sm:text-sm font-bold">
                <span>توجه اختصاصی به تک‌تک شناگران</span>
                <Check className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </div>
            </div>
          </div>

          {/* Dots Indicator for Mobile & Tablet (Interactive) */}
          <div className="flex lg:hidden items-center justify-center gap-2 pt-1" aria-hidden="true">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToBenefit(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeBenefitDot === idx
                    ? 'w-7 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'w-2 bg-cyan-900/40 hover:bg-cyan-900/60'
                }`}
                aria-label={`رفتن به ویژگی ${idx + 1}`}
              />
            ))}
          </div>
        </div>
        </section>

        {/* Organic Wave Transition: Benefits to Courses */}
        <AquaticWaveDivider topColor="#ccebf5" bottomColor="#c5e3f5" flip={true} />
      </>
    )}

      {/* =========================================================================
          SECTION 3: LIVE COURSES
          ========================================================================= */}
      {isSectionEnabled('courses') && (
        <>
          <section id="courses" className="landing-section relative w-full py-12 sm:py-16 lg:py-20 min-w-0">
        <FloatingLandingWaterIcons section="courses" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-7 relative z-10">
          <div className="landing-section__heading flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-800/15 pb-5">
            <div className="space-y-1.5">
              <Badge variant="info">برنامه آموزشی ترم جاری</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">دوره‌ها و کلاس‌های آموزشی</h2>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">کلاس‌های ثبت‌شده در سامانه، همراه با رده سنی، جنسیت و سرفصل‌های آموزشی</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-900 dark:text-cyan-200 bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-cyan-300/60 dark:border-cyan-800 shrink-0 self-start sm:self-auto shadow-xs">
              {toEnglishDigits(courses.length)} دوره آموزشی
            </span>
          </div>

          {/* Quick Category Filter for Desktop, Tablet & Mobile */}
          {courses.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none no-scrollbar">
              {courseCategories.map((cat) => {
                const isActive = courseFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCourseFilter(cat.id)}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-cyan-200/50 dark:border-cyan-800/40 hover:bg-white'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-cyan-700 text-white'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {toEnglishDigits(cat.count)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {coursesLoading ? (
            <LoadingState type="cards" count={3} message="در حال دریافت دوره‌های آموزشی..." />
          ) : filteredCourses.length ? (
            <Carousel
              items={filteredCourses}
              className="landing-carousel"
              ariaLabel="گردونه دوره‌ها و کلاس‌های آموزشی"
              visibleItems={{ mobile: 1, tablet: 2, desktop: 3 }}
              interval={4000}
              showPlayPause={false}
              showNavigation={true}
              showDots={true}
              showProgress={true}
              pauseOnHover={true}
              renderItem={(course, index) => {
                const details = getCourseDetails(course);
                const { schedule, capacity } = getCourseScheduleAndCapacity(course);
                return (
                  <article
                    key={course.id}
                    className={`landing-course landing-course--${index % 3} flex flex-col justify-between h-full flex-1`}
                  >
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="landing-course__eyebrow">
                              {course.status === 'ACTIVE' ? 'ثبت‌نام فعال' : 'پیش‌ثبت‌نام'}
                            </span>
                            {capacity !== null && (
                              <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/70 dark:border-teal-800/50">
                                {toEnglishDigits(capacity)} نفر ظرفیت
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100 min-h-[3.25rem] sm:min-h-[3.5rem] flex items-center leading-snug line-clamp-2">
                            {toEnglishDigits(course.name)}
                          </h3>
                        </div>
                        <Waves className="w-6 h-6 shrink-0 text-cyan-600 dark:text-cyan-400 mt-1" aria-hidden="true" />
                      </div>

                      {/* رده سنی و جنسیت */}
                      <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-300/70 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 text-xs">
                          <Users2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400">رده سنی:</span>
                          <strong className="font-bold">{toEnglishDigits(details.ageRange)}</strong>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-300/70 dark:border-teal-800/60 text-teal-900 dark:text-teal-200 text-xs">
                          <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400">جنسیت:</span>
                          <strong className="font-bold">{details.gender}</strong>
                        </div>
                      </div>

                      {/* چیزی که یاد میدن */}
                      <div className="mt-3.5 sm:mt-4 p-3.5 rounded-xl bg-cyan-950/5 dark:bg-slate-900/60 border border-cyan-500/20 text-xs flex-1 flex flex-col justify-start">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-900 dark:text-cyan-200 mb-1.5 shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>آنچه در این دوره یاد می‌گیرید:</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify line-clamp-3 min-h-[3.8rem]">
                          {toEnglishDigits(details.whatYouLearn)}
                        </p>
                      </div>

                      {/* اطلاعات زمان‌بندی در صورت وجود یا پیام هماهنگی سانس */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 min-h-[1.5rem]">
                        <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        {schedule ? (
                          <>
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">برنامه کلاسی:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{toEnglishDigits(schedule)}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate">برنامه کلاسی: هماهنگی سانس با پذیرش</span>
                        )}
                      </div>

                      {/* اطلاعات جلسات، شهریه و سقف اقساط مجاز */}
                      <div className="mt-3.5 pt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-cyan-500/20">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{toEnglishDigits(course.sessions_count || 12)} جلسه</span>
                          {course.base_price ? (
                            <>
                              <span className="text-slate-300 dark:text-slate-600 hidden xs:inline">•</span>
                              <span className="font-mono font-bold text-cyan-800 dark:text-cyan-300">
                                {Number(course.base_price).toLocaleString('en-US')} تومان
                              </span>
                            </>
                          ) : null}
                        </div>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] shrink-0">
                          {course.installments_count > 1 ? `اقساط تا ${toEnglishDigits(course.installments_count)} ماه` : 'پرداخت نقدی'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEnroll(course)}
                      className="landing-course__link mt-4 pt-3 border-t border-cyan-500/20 font-bold w-full cursor-pointer text-right inline-flex items-center justify-between gap-2 transition-all hover:text-cyan-700 dark:hover:text-cyan-300 group/btn"
                    >
                      <span className="group-hover/btn:translate-x-[-2px] transition-transform">ثبت‌نام و انتخاب اقساط</span>
                      <span className="w-7 h-7 rounded-xl bg-cyan-100/70 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center group-hover/btn:bg-cyan-600 group-hover/btn:text-white transition-all shadow-2xs">
                        <ArrowLeft className="w-4 h-4 group-hover/btn:translate-x-[-2px] transition-transform" aria-hidden="true" />
                      </span>
                    </button>
                  </article>
                );
              }}
            />
          ) : (
            <p className="landing-empty-state">دوره‌ای متناسب با فیلتر انتخابی یافت نشد. می‌توانید با کلیک روی «همه دوره‌ها» کلیه برنامه‌ها را مشاهده نمایید.</p>
          )}
        </div>
        </section>

        {/* Organic Wave Transition: Courses to Pools */}
        <AquaticWaveDivider topColor="#c4ecf2" bottomColor="#bfe9f0" flip={false} />
      </>
    )}

      {/* =========================================================================
          SECTION: SWIMMING POOLS & AQUATIC COMPLEXES (استخرها و مجموعه‌های ورزشی قزوین)
          ========================================================================= */}
      {isSectionEnabled('pools') && (
        <>
          <section id="pools" className="relative w-full py-12 sm:py-16 lg:py-20 min-w-0">
        <FloatingLandingWaterIcons section="pools" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-7 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-800/15 pb-5">
            <div className="space-y-1.5">
              <Badge variant="info">استخرهای طرف قرارداد در قزوین</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                مجموعه‌های آبی و استخرهای استاندارد قزوین
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                برگزاری کلاس‌های شنا در تمیزترین و مجهزترین استخرهای استان قزوین با امکانات بهداشتی و رفاهی کامل
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-900 bg-white/90 px-3.5 py-1.5 rounded-xl border border-cyan-300/60 shrink-0 self-start sm:self-auto shadow-xs">
              {pools.length} استخر استاندارد
            </span>
          </div>

          <Carousel
            items={pools}
            className="landing-carousel"
            ariaLabel="گردونه استخرهای قزوین"
            visibleItems={{ mobile: 1, tablet: 2, desktop: 3 }}
            interval={5000}
            renderItem={(pool) => {
              const poster = pool.poster_image_url || pool.poster_image || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';
              return (
                <article className="landing-news-card group bg-white/95 rounded-3xl border-2 border-cyan-100 overflow-hidden shadow-sm hover:shadow-cyan-500/10 hover:border-cyan-400/50 transition-all duration-300 flex flex-col justify-between h-full flex-1">
                  <div>
                    {/* Primary Card: Poster Photo */}
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
                      <img
                        src={poster}
                        alt={pool.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3.5 right-3.5 z-20">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md text-cyan-900 text-[11px] font-bold rounded-lg border border-cyan-200 shadow-xs">
                          <Waves className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>استخر استاندارد</span>
                        </span>
                      </div>
                      {pool.dimensions && (
                        <div className="absolute bottom-3 right-3 z-20">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold rounded-md border border-white/20">
                            {pool.dimensions}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Primary Card: Pool Name & Location */}
                    <div className="p-5 sm:p-6 space-y-3">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-cyan-700 transition-colors">
                        {pool.name}
                      </h3>

                      <div className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                        <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">{pool.location}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 text-justify font-medium">
                        {pool.description}
                      </p>
                    </div>
                  </div>

                  {/* Button to open detail modal */}
                  <div className="p-5 sm:p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => setSelectedPool(pool)}
                      className="w-full text-center py-2.5 px-4 text-xs font-bold text-cyan-900 hover:text-white bg-cyan-50/90 hover:bg-cyan-600 rounded-xl border border-cyan-200/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>مشاهده تصاویر و جزئیات استخر</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            }}
          />
        </div>
        </section>

        {/* Organic Wave Transition: Pools to Facilities */}
        <AquaticWaveDivider topColor="#bfe9f0" bottomColor="#c2ecf1" flip={true} />
      </>
    )}

      {/* =========================================================================
          SECTION 4: ACADEMY FACILITIES & INFRASTRUCTURE
          ========================================================================= */}
      {isSectionEnabled('facilities') && (
        <>
          <section id="facilities" className="relative w-full py-12 sm:py-16 lg:py-20 min-w-0">
        <FloatingLandingWaterIcons section="facilities" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-7 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <Badge variant="info">محیط استخر و بهداشت آب</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              امکانات و شرایط بهداشتی استخرها در قزوین
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              برگزاری کلاس‌ها در استخرهای تمیز و استاندارد شهر قزوین با آب گرم، تصفیه بهداشتی و وسایل کمک‌آموزشی
            </p>
            {/* Swipe hint on mobile & tablet */}
            <div className="flex lg:hidden items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-600 pt-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
              <span>برای مشاهده سایر امکانات به صورت افقی بکشید</span>
            </div>
          </div>

          <div
            ref={facilitiesTrackRef}
            onScroll={handleFacilityScroll}
            className="landing-facilities-track landing-scroll-track flex overflow-x-auto pt-4 pb-4 px-3 sm:pt-4 sm:pb-5 sm:px-5 gap-5 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:pt-4 lg:pb-5 lg:px-5 items-stretch"
          >
            {/* Feature 1 */}
            <div className="bg-white/95 p-6 rounded-3xl border-2 border-teal-200/80 shadow-[0_8px_24px_rgba(13,148,136,0.08)] hover:shadow-lg hover:border-teal-400 transition-all flex flex-col justify-between w-[82vw] sm:w-[280px] md:w-[300px] max-w-[320px] shrink-0 snap-center sm:snap-start lg:w-auto lg:max-w-none lg:shrink">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200 shadow-xs">
                    <OzonePurificationIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-teal-800 bg-teal-50 rounded-lg border border-teal-200">
                    کنترل بهداشت
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-slate-900">آب زلال و تصفیه مداوم</h4>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify font-medium">
                    تنظیم دمای آب متناسب با فصل و نظارت پیوسته بر زلالی آب استخر جهت راحتی نوآموزان و پیشگیری از سوزش چشم.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-teal-100 text-[11px] font-bold text-teal-700 flex items-center justify-between">
                <span>رعایت بهداشت و سلامت شناگران</span>
                <Check className="w-3.5 h-3.5 text-teal-600" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/95 p-6 rounded-3xl border-2 border-amber-200/80 shadow-[0_8px_24px_rgba(217,119,6,0.08)] hover:shadow-lg hover:border-amber-400 transition-all flex flex-col justify-between w-[82vw] sm:w-[280px] md:w-[300px] max-w-[320px] shrink-0 snap-center sm:snap-start lg:w-auto lg:max-w-none lg:shrink">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-xs">
                    <OlympicPoolLaneIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-amber-800 bg-amber-50 rounded-lg border border-amber-200">
                    تجهیزات کامل
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-slate-900">وسایل کمک‌آموزشی استاندارد</h4>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify font-medium">
                    استفاده از تخته شنا، نودل فومی، فین و جلیقه‌های استاندارد برای یادگیری ایمن‌تر و سریع‌تر دست و پا زدن.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-100 text-[11px] font-bold text-amber-700 flex items-center justify-between">
                <span>تسهیل یادگیری نوآموزان</span>
                <Check className="w-3.5 h-3.5 text-amber-600" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/95 p-6 rounded-3xl border-2 border-orange-200/80 shadow-[0_8px_24px_rgba(234,88,12,0.08)] hover:shadow-lg hover:border-orange-400 transition-all flex flex-col justify-between w-[82vw] sm:w-[280px] md:w-[300px] max-w-[320px] shrink-0 snap-center sm:snap-start lg:w-auto lg:max-w-none lg:shrink">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center border border-orange-200 shadow-xs">
                    <SaunaThermalSpaIcon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-orange-800 bg-orange-50 rounded-lg border border-orange-200">
                    امکانات رفاهی
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-slate-900">سونا، جکوزی و دوش تمیز</h4>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify font-medium">
                    رختکن‌های تمیز، آب گرم مناسب و دسترسی به جکوزی جهت رفع خستگی و ریکاوری بعد از تمرین.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-orange-100 text-[11px] font-bold text-orange-700 flex items-center justify-between">
                <span>ریکاوری و آرامش پس از کلاس</span>
                <Check className="w-3.5 h-3.5 text-orange-600" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/95 p-6 rounded-3xl border-2 border-indigo-200/80 shadow-[0_8px_24px_rgba(79,70,229,0.08)] hover:shadow-lg hover:border-indigo-400 transition-all flex flex-col justify-between w-[82vw] sm:w-[280px] md:w-[300px] max-w-[320px] shrink-0 snap-center sm:snap-start lg:w-auto lg:max-w-none lg:shrink">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shadow-xs">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 rounded-lg border border-indigo-200">
                    سانس‌های مجزا
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-base text-slate-900">تایم‌های تفکیک‌شده و منظم</h4>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify font-medium">
                    برنامه‌ریزی دقیق سانس‌های ویژه بانوان، آقایان و نونهالان در ساعت‌های عصر و روزهای تعطیل برای رفاه خانواده‌ها.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-100 text-[11px] font-bold text-indigo-700 flex items-center justify-between">
                <span>تایم‌بندی منعطف با برنامه شما</span>
                <Check className="w-3.5 h-3.5 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Dots Indicator for Mobile & Tablet (Interactive) */}
          <div className="flex lg:hidden items-center justify-center gap-2 pt-3" aria-hidden="true">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToFacility(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeFacilityDot === idx
                    ? 'w-7 bg-teal-500 shadow-sm shadow-teal-500/50'
                    : 'w-2 bg-teal-900/40 hover:bg-teal-900/60'
                }`}
                aria-label={`رفتن به امکان ${idx + 1}`}
              />
            ))}
          </div>
        </div>
        </section>

        {/* Organic Wave Transition: Facilities to Coaches */}
        <AquaticWaveDivider topColor="#c9efe5" bottomColor="#cef0e6" flip={true} />
      </>
    )}

      {/* =========================================================================
          SECTION 5: CERTIFIED FEDERATION COACHES
          ========================================================================= */}
      {isSectionEnabled('coaches') && (
        <>
          <section id="coaches" className="relative w-full py-12 sm:py-16 lg:py-20 min-w-0">
        <FloatingLandingWaterIcons section="coaches" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-7 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-800/15 pb-5">
            <div className="space-y-1.5">
              <Badge variant="success">کادر مربیان قزوین</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                مربیان باسابقه و رسمی مدرسه شنای ایران
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                دارای مدارک مربیگری رسمی و نجات‌غریق از فدراسیون شنا، شیرجه و واترپلو جمهوری اسلامی ایران
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-900 bg-white/90 px-3.5 py-1.5 rounded-xl border border-cyan-300/60 shrink-0 self-start sm:self-auto shadow-xs">
              {filteredCoaches.length} مربی فعال و مجاز
            </span>
          </div>

          {/* Gender Filter Tabs: مربیان مرد / مربیان زن */}
          <div className="flex items-center gap-2 p-1.5 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-cyan-200/80 shadow-xs w-fit">
            <button
              type="button"
              onClick={() => setCoachGenderTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                coachGenderTab === 'ALL'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              همه مربیان ({coaches.length})
            </button>
            <button
              type="button"
              onClick={() => setCoachGenderTab('MALE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                coachGenderTab === 'MALE'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مربیان مرد ({coaches.filter(isMaleCoach).length})
            </button>
            <button
              type="button"
              onClick={() => setCoachGenderTab('FEMALE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                coachGenderTab === 'FEMALE'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مربیان زن ({coaches.filter(isFemaleCoach).length})
            </button>
          </div>

          <Carousel
            items={filteredCoaches}
            className="landing-carousel"
            ariaLabel="اسلایدر کادر مربیان آموزشگاه"
            visibleItems={{ mobile: 1, tablet: 2, laptop: 3, desktop: 3 }}
            interval={6000}
            renderItem={(coach) => (
              <CoachProfileCard
                coach={coach}
                avatarUrl={getCoachAvatar(coach)}
              />
            )}
          />
        </div>
        </section>

        {/* Organic Wave Transition: Coaches to News */}
        <AquaticWaveDivider topColor="#cbe6f6" bottomColor="#cee5f5" flip={false} />
      </>
    )}

      {/* =========================================================================
          SECTION 6: NEWS, ARTICLES & EVENTS
          ========================================================================= */}
      {isSectionEnabled('news') && (
        <>
          <section id="news" className="relative w-full py-12 sm:py-16 lg:py-20 min-w-0">
        <FloatingLandingWaterIcons section="news" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-7 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-cyan-800/15 pb-5">
            <div className="space-y-1.5">
              <Badge variant="warning">اخبار و اطلاعیه‌ها</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                تازه‌ترین رویدادها و اطلاعیه‌های مدرسه شنای ایران
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                زمان‌بندی ترم‌های آموزشی، استعدادیابی و نکات مهم یادگیری شنا در قزوین
              </p>
            </div>
          </div>

          <Carousel
            items={news}
            className="landing-carousel"
            ariaLabel="اسلایدر اخبار و رویدادهای آموزشگاه"
            visibleItems={{ mobile: 1, tablet: 2, desktop: 3 }}
            interval={5500}
            renderItem={(item, index) => {
              const imgUrl = getNewsImage(item, index);
              const CategoryIcon = getNewsCategoryIcon(item.category);
              return (
                <article className="landing-news-card group bg-white/95 rounded-3xl border-2 border-cyan-100 overflow-hidden shadow-sm hover:shadow-cyan-500/10 hover:border-cyan-400/50 transition-all duration-300 flex flex-col justify-between h-full flex-1">
                  <div>
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
                      <img
                        src={imgUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3.5 right-3.5 z-20">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-md text-cyan-900 text-[11px] font-bold rounded-lg border border-cyan-200 shadow-xs">
                          <CategoryIcon className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>{item.category_display || 'اطلاعیه'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-800 font-mono font-bold">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        <span>{formatPersianDateString(item.publish_at)}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-cyan-700 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 text-justify font-medium">
                        {item.summary || item.body}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => setSelectedNews(item)}
                      className="w-full text-center py-2.5 px-4 text-xs font-bold text-cyan-900 hover:text-white bg-cyan-50/90 hover:bg-cyan-600 rounded-xl border border-cyan-200/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>مطالعه متن کامل خبر</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            }}
          />
        </div>
        </section>

        {/* Organic Wave Transition: News to Call to Action */}
        <AquaticWaveDivider topColor="#9cdfee" bottomColor="#8ad4e8" flip={true} />
      </>
    )}

      {/* =========================================================================
          SECTION 7: FINAL REGISTRATION CALL TO ACTION
          ========================================================================= */}
      {isSectionEnabled('cta') && (
        <>
          <section className="landing-cta relative w-full py-14 sm:py-20 lg:py-24 min-w-0">
        <FloatingLandingWaterIcons section="cta" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="landing-cta__panel relative w-full text-center space-y-6 py-8 sm:py-12 px-4 sm:px-8">
            <div className="relative max-w-3xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full text-xs sm:text-sm font-bold text-cyan-900 border border-cyan-300/60 shadow-xs">
                <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>پذیرش شناگر در تمامی رده‌های سنی در استان قزوین</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.25]">
                آماده‌اید شنا را اصولی و استاندارد شروع کنید؟
              </h2>

              <p className="text-sm sm:text-lg lg:text-xl font-bold text-slate-700 leading-relaxed max-w-2xl mx-auto">
                برای مشاوره، اطلاع از سانس‌ها یا ثبت‌نام در کلاس‌های آموزش شنای کودکان و بزرگسالان در قزوین، از طریق سامانه اقدام کنید یا با پذیرش تماس بگیرید.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  to={user ? getDashboardDestination() : '/login?mode=register'}
                  className="px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white font-black rounded-2xl shadow-lg shadow-cyan-500/25 transition-all text-base sm:text-lg inline-flex items-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <span>ورود و ثبت‌نام در دوره‌ها</span>
                  <ArrowLeft className="w-5 h-5" />
                </Link>

                <a
                  href="tel:02833650000"
                  className="px-7 sm:px-9 py-3.5 sm:py-4 bg-white hover:bg-cyan-50 text-slate-950 font-black rounded-2xl border-2 border-cyan-200/90 transition-all text-base sm:text-lg inline-flex items-center gap-2.5 shadow-md active:scale-95"
                >
                  <PhoneCall className="w-5 h-5 text-cyan-600" />
                  <span>تماس با پذیرش:</span>
                  <span dir="ltr" className="inline-block tracking-wider">۰۲۸-۳۳۶۵۰۰۰۰</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        </section>
      </>
    )}

      {/* Message if all landing sections were disabled by admin */}
      {!landingSections?.some((s) => s.is_enabled) && (
        <section className="py-24 px-4 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center mx-auto text-cyan-700 dark:text-cyan-300">
            <Waves className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
            صفحه اصلی در حال به‌روزرسانی است
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            بخش‌های محتوایی وبسایت موقتاً توسط مدیریت آموزشگاه غیرفعال شده‌اند. برای کسب اطلاعات بیشتر می‌توانید با شماره پذیرش تماس بگیرید.
          </p>
        </section>
      )}

      {/* Organic Deep-Dive Wave Transition: CTA to Footer */}
      <AquaticWaveDivider topColor="#58bfd9" bottomColor="#0d3849" crestColor="rgba(255, 255, 255, 0.75)" flip={false} />

      {/* =========================================================================
          SECTION 8: ACCESSIBLE FOOTER
          ========================================================================= */}
      <footer className="landing-footer w-full bg-gradient-to-b from-[#0d3849] to-[#061e29] pt-12 sm:pt-14 pb-8 min-w-0 relative">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-10">
            
            {/* Identity & About */}
            <div className="sm:col-span-1 lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2.5 text-cyan-300 font-extrabold text-lg">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-white flex items-center justify-center shadow-md shrink-0">
                  <SwimmerCrawlIcon className="w-5 h-5" />
                </div>
                <span className="text-white font-black text-lg">مدرسه شنای ایران - قزوین</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed text-justify sm:text-right">
                مرکز تخصصی آموزش، اصلاح تکنیک و استعدادیابی شنا در استان قزوین؛ برگزارکننده دوره‌های عمومی، نیمه‌خصوصی و خصوصی ۴ شنا ویژه کودکان، نوجوانان و بزرگسالان.
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 w-fit">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>زیر نظر مربیان رسمی فدراسیون شنا</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="sm:col-span-1 lg:col-span-2 space-y-3.5">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span>بخش‌های وبسایت</span>
              </h4>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-2.5 sm:grid-cols-1 sm:gap-2.5 text-xs text-slate-300">
                {isSectionEnabled('about') && (
                  <li>
                    <a href="#about" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                      <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                      <span>ویژگی‌ها و مزایا</span>
                    </a>
                  </li>
                )}
                {isSectionEnabled('courses') && (
                  <li>
                    <a href="#courses" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                      <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                      <span>برنامه دوره‌ها</span>
                    </a>
                  </li>
                )}
                {isSectionEnabled('pools') && (
                  <li>
                    <a href="#pools" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                      <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                      <span>استخرهای طرف قرارداد</span>
                    </a>
                  </li>
                )}
                {isSectionEnabled('facilities') && (
                  <li>
                    <a href="#facilities" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                      <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                      <span>امکانات و شرایط</span>
                    </a>
                  </li>
                )}
                {isSectionEnabled('coaches') && (
                  <li>
                    <a href="#coaches" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                      <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                      <span>کادر مربیان قزوین</span>
                    </a>
                  </li>
                )}
                {isSectionEnabled('news') && (
                  <li>
                    <a href="#news" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 py-0.5 group">
                      <span className="text-cyan-400/60 group-hover:text-cyan-300 text-[10px] transition-colors">‹</span>
                      <span>اخبار و اطلاعیه‌ها</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Contact */}
            <div className="sm:col-span-1 lg:col-span-3 space-y-3.5">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span>اطلاعات تماس و استخرها</span>
              </h4>
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>قزوین، استخرها و مجموعه‌های ورزشی طرف قرارداد مدرسه شنای ایران</span>
                </p>
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-teal-400 shrink-0" />
                  <a
                    href="tel:02833650000"
                    className="hover:text-cyan-300 transition-colors flex items-center gap-2 font-medium group"
                  >
                    <span>تلفن هماهنگی:</span>
                    <span dir="ltr" className="inline-block font-bold text-cyan-300 group-hover:underline tracking-wider">۰۲۸-۳۳۶۵۰۰۰۰</span>
                    <span className="text-[10px] text-cyan-400/80 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/50">تماس مستقیم</span>
                  </a>
                </div>
                <p className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>پاسخگویی: شنبه تا پنج‌شنبه ۹ الی ۲۰</span>
                </p>
              </div>
            </div>

            {/* Trust Seal (Enamad) */}
            <div className="sm:col-span-1 lg:col-span-3 flex flex-col items-start sm:items-center lg:items-start space-y-3.5">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span>نماد اعتماد</span>
              </h4>
              <a
                referrerPolicy="origin"
                target="_blank"
                href="https://trustseal.enamad.ir/?id=8412006&Code=JQjDkp1A7Vlcx7g8vFbifdbIAGnkdkJm"
                aria-label="نماد اعتماد الکترونیکی"
                className="inline-flex items-center justify-center rounded-2xl bg-white/95 hover:bg-white p-2.5 shadow-lg border border-cyan-200/30 transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <img
                  referrerPolicy="origin"
                  src="https://trustseal.enamad.ir/logo.aspx?id=8412006&Code=JQjDkp1A7Vlcx7g8vFbifdbIAGnkdkJm"
                  alt="نماد اعتماد الکترونیکی"
                  style={{ cursor: 'pointer' }}
                  code="JQjDkp1A7Vlcx7g8vFbifdbIAGnkdkJm"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              </a>
            </div>
          </div>

          {/* About Rayban Team & Creator Banner */}
          <div className="mt-10 pt-8 border-t border-cyan-900/40">
            <div className="rounded-2xl bg-gradient-to-r from-slate-900/90 via-cyan-950/40 to-slate-900/90 border border-cyan-500/20 p-4 sm:p-5 backdrop-blur-sm shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-cyan-500/20 shrink-0">
                    ر
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-white font-extrabold text-sm sm:text-base">
                        تیم نرم‌افزاری رایبان
                      </h4>
                      <span className="text-[10px] text-cyan-300 bg-cyan-950/90 border border-cyan-600/40 px-2 py-0.5 rounded-full font-bold">
                        طراح و سازنده سامانه
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      طراحی، پیاده‌سازی و ساخت اختصاصی این سامانه جامع توسط <strong className="text-cyan-300 font-bold">تیم رایبان</strong> انجام شده است.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRaybanModal(true)}
                  className="shrink-0 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/30 transition-all text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>درباره رایبان</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Divider & Copyright */}
          <div className="border-t border-slate-800/80 pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-right leading-relaxed">
              <p>
                کلیه حقوق مادی و معنوی این سامانه متعلق به <span className="text-cyan-300 font-bold">تیم رایبان</span> می‌باشد © ۱۴۰۵
              </p>
              <span className="hidden sm:inline text-slate-600">•</span>
              <p className="text-slate-400 flex items-center gap-1.5">
                <span>سازنده سامانه:</span>
                <span className="text-slate-200 font-medium">تیم نرم‌افزاری رایبان</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer group py-1.5 px-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-cyan-800/40"
              aria-label="بازگشت به ابتدای صفحه"
            >
              <span>بازگشت به بالا</span>
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </footer>

      </div>

      {/* =========================================================================
          NEWS DETAIL MODAL
          ========================================================================= */}
      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title={selectedNews?.title || 'مشاهده خبر'}
        maxWidth="max-w-3xl"
      >
        {selectedNews && (
          <div className="space-y-5 text-right">
            <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
              <img
                src={getNewsImage(selectedNews, 0)}
                alt={selectedNews.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 bg-slate-900/90 backdrop-blur-md text-cyan-300 text-xs font-bold rounded-lg border border-cyan-400/30">
                  {selectedNews.category_display || 'اطلاعیه'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-semibold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                دسته‌بندی: {selectedNews.category_display || 'عمومی'}
              </span>
              <span className="font-mono">
                تاریخ انتشار: {formatPersianDateString(selectedNews.publish_at)}
              </span>
            </div>

            {selectedNews.summary && (
              <p className="text-sm font-semibold text-cyan-100 leading-relaxed bg-slate-800/70 p-4 rounded-xl border border-cyan-500/20">
                {selectedNews.summary}
              </p>
            )}

            <div className="text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-line text-justify">
              {selectedNews.body}
            </div>

            {/* Additional Description Images (عکس‌های مربوط به شرح خبر) */}
            {selectedNews.detail_images && selectedNews.detail_images.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>تصاویر و شرح تصویری رویداد:</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedNews.detail_images.map((imgObj, i) => {
                    const src = imgObj.image_url || imgObj.image;
                    return (
                      <div key={imgObj.id || i} className="group relative rounded-xl overflow-hidden bg-slate-950 border border-cyan-500/20 aspect-video">
                        <img
                          src={src}
                          alt={imgObj.caption || `تصویر شرح ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {imgObj.caption && (
                          <span className="absolute bottom-0 inset-x-0 p-1.5 bg-black/70 text-[10px] text-slate-200 truncate">
                            {imgObj.caption}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button size="sm" onClick={() => setSelectedNews(null)}>
                بستن پنجره
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =========================================================================
          POOL DETAIL MODAL (جزئیات استخر همراه با عکس‌های بیشتر و مشخصات کامل)
          ========================================================================= */}
      <Modal
        isOpen={!!selectedPool}
        onClose={() => setSelectedPool(null)}
        title={selectedPool?.name || 'جزئیات استخر'}
        maxWidth="max-w-4xl"
      >
        {selectedPool && (
          <div className="space-y-5 text-right">
            {/* Main Poster */}
            <div className="relative h-60 sm:h-72 w-full rounded-2xl overflow-hidden bg-slate-950 shadow-md">
              <img
                src={selectedPool.poster_image_url || selectedPool.poster_image || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80'}
                alt={selectedPool.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-900/90 backdrop-blur-md text-cyan-300 text-xs font-bold rounded-lg border border-cyan-400/30">
                  {selectedPool.dimensions || 'استخر استاندارد'}
                </span>
                {selectedPool.depth && (
                  <span className="px-3 py-1 bg-slate-900/90 backdrop-blur-md text-teal-300 text-xs font-bold rounded-lg border border-teal-400/30">
                    عمق: {selectedPool.depth}
                  </span>
                )}
              </div>
            </div>

            {/* Title & Location */}
            <div className="space-y-2 pb-2 border-b border-slate-800">
              <h3 className="text-xl sm:text-2xl font-black text-slate-100">{selectedPool.name}</h3>
              <p className="flex items-center gap-2 text-xs sm:text-sm text-cyan-300 font-medium">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{selectedPool.location}</span>
              </p>
              {selectedPool.phone && (
                <p className="flex items-center gap-2 text-xs text-slate-400">
                  <PhoneCall className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>تلفن هماهنگی:</span>
                  <span dir="ltr" className="inline-block font-medium">{selectedPool.phone}</span>
                </p>
              )}
            </div>

            {/* Description & specs */}
            <div className="p-4 bg-slate-800/70 rounded-2xl border border-cyan-500/20 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap text-justify">
              {selectedPool.description}
            </div>

            {/* Facilities */}
            {selectedPool.facilities && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>امکانات رفاهی و بهداشتی استخر:</span>
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                  {selectedPool.facilities}
                </p>
              </div>
            )}

            {/* Gallery: More photos of the pool (عکس‌های بیشتر مربوط به استخر) */}
            {selectedPool.gallery_images && selectedPool.gallery_images.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-slate-800">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  <span>عکس‌های بیشتر از بخش‌های مختلف استخر:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedPool.gallery_images.map((imgObj, idx) => (
                    <div key={imgObj.id || idx} className="rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-700 shadow-sm">
                      <img
                        src={imgObj.image_url || imgObj.image}
                        alt={`تصویر ${idx + 1} از ${selectedPool.name}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button size="sm" onClick={() => setSelectedPool(null)}>
                بستن پنجره
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Course Enrollment & Installment Selection Modal */}
      <Modal
        isOpen={Boolean(enrollingCourse)}
        onClose={() => setEnrollingCourse(null)}
        title={enrollingCourse ? `ثبت‌نام در دوره: ${enrollingCourse.name}` : ''}
      >
        {enrollingCourse && (
          <form onSubmit={handleEnrollSubmit} className="space-y-4 course-enrollment-modal">
            {/* Course Summary Box */}
            <div className="p-4 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl border border-sky-200/80 dark:border-sky-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">شهریه کل دوره:</span>
                <span className="text-sm font-mono font-black text-sky-800 dark:text-sky-200">
                  {Number(enrollingCourse.base_price || 0).toLocaleString('en-US')} تومان
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">تعداد جلسات:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{toEnglishDigits(enrollingCourse.sessions_count)} جلسه</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">سقف اقساط مجاز دوره:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {enrollingCourse.installments_count > 1 ? `تا ${toEnglishDigits(enrollingCourse.installments_count)} قسط` : 'فقط پرداخت یکجا'}
                </span>
              </div>
            </div>

            {/* Applicant Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی متقاضی *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: علی رضایی"
                  value={enrollForm.applicant_name}
                  onChange={(e) => setEnrollForm({ ...enrollForm, applicant_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شماره همراه (جهت پیامک و ورود) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="09123456789"
                  value={enrollForm.applicant_phone}
                  onChange={(e) => setEnrollForm({ ...enrollForm, applicant_phone: e.target.value })}
                  dir="ltr"
                  className="w-full px-3 py-2 text-xs font-mono text-left bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Installment Selection (User can choose fewer than course max!) */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  انتخاب نحوه پرداخت و تعداد اقساط:
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700">
                  {enrollForm.selected_installments > 1 ? `${toEnglishDigits(enrollForm.selected_installments)} قسط` : 'یکجا'}
                </span>
              </div>

              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300">
                این دوره امکان تقسیط تا سقف {toEnglishDigits(enrollingCourse.installments_count || 1)} قسط را دارد. شما می‌توانید به دلخواه پرداخت یکجا یا اقساط کمتر را برگزینید:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {Array.from({ length: Math.max(1, enrollingCourse.installments_count || 1) }, (_, i) => i + 1).map((count) => {
                  const isSelected = enrollForm.selected_installments === count;
                  const instAmount = Math.round(Number(enrollingCourse.base_price || 0) / count);
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setEnrollForm({ ...enrollForm, selected_installments: count })}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">
                          {count === 1 ? 'پرداخت یکجا (نقدی)' : `${toEnglishDigits(count)} قسط مساوی`}
                        </span>
                        <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          هر قسط: {Number(instAmount).toLocaleString('en-US')} تومان
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-white bg-white text-emerald-600' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                یادداشت یا توضیحات شناگر (اختیاری)
              </label>
              <textarea
                rows={2}
                placeholder="توضیحات تکمیلی یا سوالات شما در مورد دوره..."
                value={enrollForm.notes}
                onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setEnrollingCourse(null)}>
                انصراف
              </Button>
              <Button type="submit" disabled={enrollSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {enrollSubmitting ? 'در حال ثبت...' : 'ثبت قطعی درخواست ثبت‌نام'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* =========================================================================
          ABOUT RAYBAN TEAM MODAL
          ========================================================================= */}
      <Modal
        isOpen={showRaybanModal}
        onClose={() => setShowRaybanModal(false)}
        title="درباره تیم نرم‌افزاری رایبان (Rayban)"
        maxWidth="max-w-xl"
      >
        <div className="space-y-5 text-right p-1">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              ر
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                تیم نرم‌افزاری و توسعه فناوری رایبان
              </h3>
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5">
                طراح، معمار و سازنده پلتفرم مدیریت مدرسه شنا
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
            <p>
              تیم نرم‌افزاری <strong>رایبان</strong> متشکل از متخصصان حوزه مهندسی نرم‌افزار، طراحی تجربه کاربری و سامانه‌های ابری است که با هدف ارتقای سطح کیفی مدیریت کسب‌وکارهای ورزشی و آموزشی، پلتفرم‌های اختصاصی، امن و پرسرعت را طراحی و پیاده‌سازی می‌نماید.
            </p>
            <p>
              تمامی زیرساخت‌های این وب‌اپلیکیشن اعم از فرانت‌اند ریسپانسیو، سرویس‌های بک‌اند، ماژول‌های رزرو و ثبت‌نام آنلاین، پورتال مربیان و شناگران، جدول برنامه‌ریزی استخرها و مدیریت مالی به طور اختصاصی توسط تیم رایبان توسعه داده شده است.
            </p>
          </div>

          <div className="bg-cyan-50 dark:bg-cyan-950/40 rounded-xl p-3.5 border border-cyan-200 dark:border-cyan-800/40 text-xs text-cyan-900 dark:text-cyan-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>مالکیت فکری و کپی‌رایت:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-cyan-800 dark:text-cyan-300">
              کلیه حقوق مادی و معنوی، کدهای منبع، ساختار دیتابیس و طراحی این سامانه در انحصار تیم نرم‌افزاری رایبان محفوظ می‌باشد.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRaybanModal(false)}
              className="text-xs font-bold"
            >
              بستن
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
