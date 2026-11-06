import React, { useState, useEffect } from 'react';
import {
  Globe, Waves, Users2, Newspaper, BookOpen, Plus, Edit, Trash2,
  MapPin, Eye, EyeOff, ArrowUpDown, Save, Check, CheckCircle2, Clock,
  Upload, Image as ImageIcon, X, Sparkles, Phone, PhoneCall, Award, Shield,
  ArrowUp, ArrowDown, ArrowLeft, RefreshCw, LayoutTemplate, ExternalLink, Building2,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { useLandingSections } from '../../context/LandingSectionsContext';
import { SwimmerCrawlIcon, OlympicPoolLaneIcon } from '../../components/common/AquaticIcons';

export const AdminWebsiteManagerPage = () => {
  const toast = useToast();
  const {
    sections: landingSections,
    isSectionEnabled,
    toggleSection,
    setAllSections,
    reloadSections,
  } = useLandingSections();
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'pools' | 'coaches' | 'news' | 'courses'
  const [togglingKey, setTogglingKey] = useState(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(true);

  const handleToggleSection = async (key) => {
    try {
      setTogglingKey(key);
      const targetSec = landingSections.find((s) => s.key === key);
      const willEnable = !targetSec?.is_enabled;
      const res = await toggleSection(key);
      if (res.success) {
        toast.success(
          `بخش «${targetSec?.title || key}» با موفقیت ${willEnable ? 'فعال شد و در صفحه لندینگ نمایش داده می‌شود' : 'غیرفعال شد و از صفحه لندینگ مخفی گردید'}.`
        );
      } else {
        toast.error(res.error || 'خطا در تغییر وضعیت بخش');
      }
    } catch {
      toast.error('خطای غیرمنتظره در تغییر وضعیت بخش');
    } finally {
      setTogglingKey(null);
    }
  };

  const handleSetAllSections = async (enabled) => {
    try {
      setBulkUpdating(true);
      const res = await setAllSections(enabled);
      if (res.success) {
        toast.success(
          enabled
            ? 'تمامی ۸ بخش صفحه لندینگ با موفقیت فعال و نمایان شدند.'
            : 'تمامی بخش‌های اختیاری صفحه لندینگ غیرفعال و مخفی شدند.'
        );
      } else {
        toast.error(res.error || 'خطا در به‌روزرسانی گروهی بخش‌ها');
      }
    } catch {
      toast.error('خطای غیرمنتظره در تغییر گروهی بخش‌ها');
    } finally {
      setBulkUpdating(false);
    }
  };

  // =========================================================================
  // 1. POOLS STATE
  // =========================================================================
  const [pools, setPools] = useState([]);
  const [poolModalOpen, setPoolModalOpen] = useState(false);
  const [editingPool, setEditingPool] = useState(null);
  const [poolForm, setPoolForm] = useState({
    name: '',
    slug: '',
    location: '',
    description: '',
    facilities: '',
    dimensions: '',
    depth: '',
    phone: '',
    display_order: 1,
    is_active: true,
  });
  const [poolPosterFile, setPoolPosterFile] = useState(null);
  const [poolPosterPreview, setPoolPosterPreview] = useState(null);
  const [poolGalleryFiles, setPoolGalleryFiles] = useState([]);
  const [poolSubmitting, setPoolSubmitting] = useState(false);
  const [previewPool, setPreviewPool] = useState(null);

  // =========================================================================
  // 2. COACHES STATE & ORDERING
  // =========================================================================
  const [coaches, setCoaches] = useState([]);
  const [coachGenderTab, setCoachGenderTab] = useState('MALE'); // 'MALE' | 'FEMALE'
  const [coachOrderList, setCoachOrderList] = useState([]);
  const [coachSavingOrder, setCoachSavingOrder] = useState(false);
  const [coachModalOpen, setCoachModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [coachForm, setCoachForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    gender: 'MALE',
    display_order: 1,
    specialties: '',
    bio: '',
    employment_status: 'ACTIVE',
  });
  const [coachAvatarFile, setCoachAvatarFile] = useState(null);
  const [coachAvatarPreview, setCoachAvatarPreview] = useState(null);
  const [coachSubmitting, setCoachSubmitting] = useState(false);

  // =========================================================================
  // 3. NEWS STATE
  // =========================================================================
  const [news, setNews] = useState([]);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    slug: '',
    category: 'GENERAL',
    status: 'PUBLISHED',
    summary: '',
    body: '',
  });
  const [newsPosterFile, setNewsPosterFile] = useState(null);
  const [newsPosterPreview, setNewsPosterPreview] = useState(null);
  const [newsDetailFiles, setNewsDetailFiles] = useState([]);
  const [newsSubmitting, setNewsSubmitting] = useState(false);
  const [previewNews, setPreviewNews] = useState(null);

  // =========================================================================
  // 4. COURSES STATE
  // =========================================================================
  const [courses, setCourses] = useState([]);

  // Fetch all website data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [poolsRes, coachesRes, newsRes, coursesRes] = await Promise.allSettled([
        api.get('/content/pools/'),
        api.get('/coaches/'),
        api.get('/content/news/'),
        api.get('/education/courses/'),
      ]);

      if (poolsRes.status === 'fulfilled' && poolsRes.value?.data) {
        const pList = poolsRes.value.data.results || poolsRes.value.data;
        setPools(pList);
      }
      if (coachesRes.status === 'fulfilled' && coachesRes.value?.data) {
        const cList = coachesRes.value.data.results || coachesRes.value.data;
        const sorted = [...cList].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
        setCoaches(sorted);
        setCoachOrderList(sorted);
      }
      if (newsRes.status === 'fulfilled' && newsRes.value?.data) {
        const nList = newsRes.value.data.results || newsRes.value.data;
        setNews(nList);
      }
      if (coursesRes.status === 'fulfilled' && coursesRes.value?.data) {
        const crList = coursesRes.value.data.results || coursesRes.value.data;
        setCourses(crList);
      }
      reloadSections();
    } catch (err) {
      console.error(err);
      toast.error('خطا در بارگذاری محتوای وبسایت');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Sync coach order list when coaches change
  useEffect(() => {
    setCoachOrderList(coaches);
  }, [coaches]);

  // =========================================================================
  // POOLS HANDLERS
  // =========================================================================
  const handleOpenCreatePool = () => {
    setEditingPool(null);
    setPoolForm({
      name: '',
      slug: '',
      location: '',
      description: '',
      facilities: 'سونا خشک و بخار، جکوزی، بوفه، پارکینگ، رختکن تمیز',
      dimensions: '۵۰ در ۲۵ متر',
      depth: '۱.۲۰ الی ۳.۵۰ متر',
      phone: '',
      display_order: pools.length + 1,
      is_active: true,
    });
    setPoolPosterFile(null);
    setPoolPosterPreview(null);
    setPoolGalleryFiles([]);
    setPoolModalOpen(true);
  };

  const handleOpenEditPool = (pool) => {
    setEditingPool(pool);
    setPoolForm({
      name: pool.name || '',
      slug: pool.slug || '',
      location: pool.location || '',
      description: pool.description || '',
      facilities: pool.facilities || '',
      dimensions: pool.dimensions || '',
      depth: pool.depth || '',
      phone: pool.phone || '',
      display_order: pool.display_order ?? 1,
      is_active: pool.is_active ?? true,
    });
    setPoolPosterFile(null);
    setPoolPosterPreview(pool.poster_image_url || pool.poster_image || null);
    setPoolGalleryFiles([]);
    setPoolModalOpen(true);
  };

  const handlePoolSubmit = async (e) => {
    e.preventDefault();
    if (!poolForm.name.trim() || !poolForm.location.trim()) {
      toast.error('نام استخر و لوکیشن الزامی هستند.');
      return;
    }

    try {
      setPoolSubmitting(true);
      const formData = new FormData();
      Object.entries(poolForm).forEach(([k, v]) => {
        formData.append(k, v);
      });

      if (poolPosterFile) {
        formData.append('poster_image', poolPosterFile);
      }
      poolGalleryFiles.forEach((f) => {
        formData.append('gallery_images', f);
      });

      if (editingPool) {
        await api.put(`/content/pools/${editingPool.slug}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(`اطلاعات استخر "${poolForm.name}" با موفقیت به‌روزرسانی شد.`);
      } else {
        await api.post('/content/pools/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(`استخر جدید "${poolForm.name}" با موفقیت ثبت گردید.`);
      }

      setPoolModalOpen(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت اطلاعات استخر');
    } finally {
      setPoolSubmitting(false);
    }
  };

  const handleDeletePool = async (slug) => {
    if (!window.confirm('آیا از حذف این استخر اطمینان دارید؟')) return;
    try {
      await api.delete(`/content/pools/${slug}/`);
      toast.success('استخر با موفقیت حذف شد.');
      fetchAllData();
    } catch {
      toast.error('خطا در حذف استخر');
    }
  };

  const handleDeletePoolGalleryImage = async (imageId) => {
    try {
      await api.delete(`/content/pools/images/${imageId}/`);
      toast.success('تصویر گالری استخر حذف شد.');
      if (editingPool) {
        setEditingPool({
          ...editingPool,
          gallery_images: editingPool.gallery_images.filter((img) => img.id !== imageId),
        });
      }
      fetchAllData();
    } catch {
      toast.error('خطا در حذف تصویر گالری');
    }
  };

  // =========================================================================
  // COACH ORDERING & MANAGEMENT HANDLERS
  // =========================================================================
  const isFemaleCoach = (c) => {
    if (c.gender === 'FEMALE') return true;
    if (c.gender === 'MALE') return false;
    const name = c.full_name || '';
    return name.includes('سارا') || name.includes('مریم') || name.includes('زهرا') || name.includes('خانم');
  };

  const isMaleCoach = (c) => !isFemaleCoach(c);

  const filteredCoaches = coachOrderList.filter((c) => {
    if (coachGenderTab === 'MALE') return isMaleCoach(c);
    if (coachGenderTab === 'FEMALE') return isFemaleCoach(c);
    return true;
  });

  const handleMoveCoach = (index, direction) => {
    const list = [...filteredCoaches];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap in filtered list
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Reassign display_order sequentially
    const updated = list.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    // Merge back into full coachOrderList
    const otherCoaches = coachOrderList.filter((c) =>
      coachGenderTab === 'MALE' ? !isMaleCoach(c) : !isFemaleCoach(c)
    );

    setCoachOrderList([...otherCoaches, ...updated].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)));
  };

  const handleSaveCoachOrders = async () => {
    try {
      setCoachSavingOrder(true);
      const ordersPayload = coachOrderList.map((c, idx) => ({
        id: c.id,
        display_order: c.display_order ?? idx + 1,
      }));

      await api.post('/coaches/reorder/', { orders: ordersPayload });
      toast.success('ترتیب چینش مربیان با موفقیت ذخیره گردید.');
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('خطا در ذخیره ترتیب چینش مربیان');
    } finally {
      setCoachSavingOrder(false);
    }
  };

  const handleOpenEditCoach = (coach) => {
    setEditingCoach(coach);
    setCoachForm({
      first_name: coach.first_name || '',
      last_name: coach.last_name || '',
      phone: coach.phone || '',
      gender: coach.gender || (isFemaleCoach(coach) ? 'FEMALE' : 'MALE'),
      display_order: coach.display_order ?? 1,
      specialties: coach.specialties || '',
      bio: coach.bio || '',
      employment_status: coach.employment_status || 'ACTIVE',
    });
    setCoachAvatarFile(null);
    setCoachAvatarPreview(coach.avatar || null);
    setCoachModalOpen(true);
  };

  const handleCoachSubmit = async (e) => {
    e.preventDefault();
    if (!editingCoach) return;
    try {
      setCoachSubmitting(true);
      const formData = new FormData();
      Object.entries(coachForm).forEach(([k, v]) => {
        formData.append(k, v);
      });
      if (coachAvatarFile) {
        formData.append('avatar', coachAvatarFile);
      }

      await api.patch(`/coaches/${editingCoach.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`اطلاعات مربی "${coachForm.first_name} ${coachForm.last_name}" به‌روزرسانی شد.`);
      setCoachModalOpen(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error('خطا در به‌روزرسانی مربی');
    } finally {
      setCoachSubmitting(false);
    }
  };

  // =========================================================================
  // NEWS HANDLERS
  // =========================================================================
  const handleOpenCreateNews = () => {
    setEditingNews(null);
    setNewsForm({
      title: '',
      slug: '',
      category: 'GENERAL',
      status: 'PUBLISHED',
      summary: '',
      body: '',
    });
    setNewsPosterFile(null);
    setNewsPosterPreview(null);
    setNewsDetailFiles([]);
    setNewsModalOpen(true);
  };

  const handleOpenEditNews = (post) => {
    setEditingNews(post);
    setNewsForm({
      title: post.title || '',
      slug: post.slug || '',
      category: post.category || 'GENERAL',
      status: post.status || 'PUBLISHED',
      summary: post.summary || '',
      body: post.body || '',
    });
    setNewsPosterFile(null);
    setNewsPosterPreview(post.image_url || post.image || null);
    setNewsDetailFiles([]);
    setNewsModalOpen(true);
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    if (!newsForm.title.trim() || !newsForm.body.trim()) {
      toast.error('عنوان و متن خبر الزامی هستند.');
      return;
    }

    try {
      setNewsSubmitting(true);
      const formData = new FormData();
      Object.entries(newsForm).forEach(([k, v]) => {
        formData.append(k, v);
      });

      if (newsPosterFile) {
        formData.append('image', newsPosterFile);
      }
      newsDetailFiles.forEach((f) => {
        formData.append('detail_images', f);
      });

      if (editingNews) {
        await api.put(`/content/news/${editingNews.slug}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('خبر با موفقیت به‌روزرسانی گردید.');
      } else {
        await api.post('/content/news/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('خبر جدید با موفقیت منتشر شد.');
      }

      setNewsModalOpen(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'خطا در ثبت خبر');
    } finally {
      setNewsSubmitting(false);
    }
  };

  const handleDeleteNews = async (slug) => {
    if (!window.confirm('آیا از حذف این خبر اطمینان دارید؟')) return;
    try {
      await api.delete(`/content/news/${slug}/`);
      toast.success('خبر با موفقیت حذف شد.');
      fetchAllData();
    } catch {
      toast.error('خطا در حذف خبر');
    }
  };

  const handleDeleteNewsDetailImage = async (imageId) => {
    try {
      await api.delete(`/content/news/images/${imageId}/`);
      toast.success('تصویر شرح خبر حذف گردید.');
      if (editingNews) {
        setEditingNews({
          ...editingNews,
          detail_images: editingNews.detail_images.filter((img) => img.id !== imageId),
        });
      }
      fetchAllData();
    } catch {
      toast.error('خطا در حذف تصویر شرح خبر');
    }
  };

  // Helper labels
  const categoryLabels = {
    GENERAL: 'عمومی و اطلاعیه‌ها',
    COMPETITIONS: 'مسابقات و رویدادها',
    CLASSES: 'دوره‌ها و کلاس‌ها',
    HEALTH: 'آموزش و بهداشت استخر',
  };

  const SECTION_METAS = {
    hero: {
      icon: Sparkles,
      colorClass: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
      badge: 'بخش ۱ • ورودی اصلی',
      actionTab: null,
      previewAnchor: '#',
    },
    about: {
      icon: Award,
      colorClass: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      badge: 'بخش ۲ • متد و ویژگی‌ها',
      actionTab: null,
      previewAnchor: '#about',
    },
    courses: {
      icon: BookOpen,
      colorClass: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-800',
      badge: 'بخش ۳ • دوره‌های جاری',
      actionTab: 'courses',
      previewAnchor: '#courses',
    },
    pools: {
      icon: Waves,
      colorClass: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800',
      badge: 'بخش ۴ • استخرهای قزوین',
      actionTab: 'pools',
      previewAnchor: '#pools',
    },
    facilities: {
      icon: Building2,
      colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      badge: 'بخش ۵ • امکانات و بهداشت',
      actionTab: null,
      previewAnchor: '#facilities',
    },
    coaches: {
      icon: Users2,
      colorClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
      badge: 'بخش ۶ • کادر مربیان',
      actionTab: 'coaches',
      previewAnchor: '#coaches',
    },
    news: {
      icon: Newspaper,
      colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      badge: 'بخش ۷ • اخبار و اطلاعیه‌ها',
      actionTab: 'news',
      previewAnchor: '#news',
    },
    cta: {
      icon: PhoneCall,
      colorClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      badge: 'بخش ۸ • ثبت‌نام و مشاوره',
      actionTab: null,
      previewAnchor: '#',
    },
  };

  const renderSectionStatusBanner = (sectionKey, sectionTitle) => {
    const isEnabled = isSectionEnabled(sectionKey);
    const isToggling = togglingKey === sectionKey;
    return (
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
          isEnabled
            ? 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-100'
            : 'bg-amber-50/90 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-100'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isEnabled
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            {isEnabled ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-base sm:text-lg">وضعیت بخش «{sectionTitle}» در صفحه لندینگ:</span>
              <span
                className={`text-xs sm:text-sm px-3.5 py-1 rounded-full font-black ${
                  isEnabled
                    ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-200/80 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                }`}
              >
                {isEnabled ? '● در حال نمایش در صفحه اصلی' : '○ غیرفعال (مخفی از دید کاربران)'}
              </span>
            </div>
            <p className="text-xs sm:text-sm opacity-90 mt-1 font-semibold leading-relaxed">
              {isEnabled
                ? 'این بخش هم‌اکنون در صفحه اصلی وبسایت به تمام بازدیدکنندگان نمایش داده می‌شود.'
                : 'این بخش موقتاً خاموش شده و در صفحه اصلی برای بازدیدکنندگان پنهان است.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleToggleSection(sectionKey)}
          disabled={isToggling}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
            isEnabled
              ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300/60'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
          }`}
        >
          {isToggling ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>در حال تغییر...</span>
            </>
          ) : isEnabled ? (
            <>
              <EyeOff className="w-4.5 h-4.5" />
              <span>غیرفعال کردن (مخفی در لندینگ)</span>
            </>
          ) : (
            <>
              <Eye className="w-4.5 h-4.5" />
              <span>فعال کردن (نمایش در لندینگ)</span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-900 via-sky-900 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-cyan-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 rounded-full text-xs sm:text-sm font-black text-cyan-200 border border-white/15">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>سامانه یکپارچه مدیریت محتوای وبسایت و صفحه لندینگ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            مدیریت وبسایت، استخرها، مربیان و اخبار
          </h1>
          <p className="text-sm sm:text-base text-cyan-100/95 max-w-2xl font-medium leading-relaxed">
            مدیریت زنده بخش‌های صفحه اصلی با همان استانداردهای گرافیکی: کارت استخرها و تصاویر تکمیلی، ترتیب کادر مربیان (آقا و خانم)، ارسال اخبار به همراه پوستر و تصاویر شرح خبر.
          </p>
        </div>

        <Button
          onClick={fetchAllData}
          variant="outline"
          className="bg-white/10 text-white hover:bg-white/20 border-white/20 text-xs sm:text-sm font-bold shrink-0 gap-2 py-2.5 px-4"
        >
          <RefreshCw className="w-4 h-4" />
          <span>به‌روزرسانی داده‌ها</span>
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex w-full overflow-x-auto gap-1.5 sm:gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`flex-1 min-w-max md:min-w-0 justify-center px-2 sm:px-3 lg:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs lg:text-[13px] 2xl:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <LayoutTemplate className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>
            بخش‌های لندینگ ({landingSections.filter((s) => s.is_enabled).length} از {landingSections.length}<span className="hidden 2xl:inline"> فعال</span>)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pools')}
          className={`flex-1 min-w-max md:min-w-0 justify-center px-2 sm:px-3 lg:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs lg:text-[13px] 2xl:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'pools'
              ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Waves className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>استخرها و مجموعه‌های آبی ({pools.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coaches')}
          className={`flex-1 min-w-max md:min-w-0 justify-center px-2 sm:px-3 lg:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs lg:text-[13px] 2xl:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'coaches'
              ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Users2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>کادر مربیان و چینش ({coaches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('news')}
          className={`flex-1 min-w-max md:min-w-0 justify-center px-2 sm:px-3 lg:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs lg:text-[13px] 2xl:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'news'
              ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Newspaper className="w-4 h-4 text-amber-600 shrink-0" />
          <span>اخبار و رویدادها ({news.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className={`flex-1 min-w-max md:min-w-0 justify-center px-2 sm:px-3 lg:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs lg:text-[13px] 2xl:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
          <span>دوره‌های لندینگ ({courses.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingState type="cards" count={3} message="در حال دریافت محتوای وبسایت..." />
      ) : (
        <>
          {/* =========================================================================
              TAB 0: LANDING SECTIONS (مدیریت بخش‌های صفحه اصلی و فعال/غیرفعال‌سازی)
              ========================================================================= */}
          {activeTab === 'sections' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <LayoutTemplate className="w-6 h-6 text-cyan-600 shrink-0" />
                    <span>مدیریت و فعال/غیرفعال‌سازی بخش‌های صفحه اصلی (Landing)</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-3xl">
                    هر بخشی از صفحه لندینگ را که تمایل ندارید به عموم کاربران نمایش داده شود، با کلیک روی کلید سوئیچ خاموش کنید. بخش غیرفعال بلافاصله از صفحه اصلی و منوی ناوبری بالایی حذف می‌شود.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => handleSetAllSections(true)}
                    disabled={bulkUpdating}
                    variant="outline"
                    className="gap-2 text-xs sm:text-sm font-black py-2.5 px-4 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    <span>فعال‌سازی همه بخش‌ها</span>
                  </Button>

                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>مشاهده زنده لندینگ</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-4 shadow-2xs">
                  <div className="w-13 h-13 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 flex items-center justify-center border border-cyan-200/60 shrink-0">
                    <LayoutTemplate className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bold">کل بخش‌های صفحه اصلی</div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {landingSections.length} بخش ساختاری
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 flex items-center gap-4 shadow-2xs">
                  <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bold">بخش‌های فعال و در حال نمایش</div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {landingSections.filter((s) => s.is_enabled).length} بخش نمایان
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 flex items-center gap-4 shadow-2xs">
                  <div className="w-13 h-13 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center border border-amber-200/60 shrink-0">
                    <EyeOff className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bold">بخش‌های غیرفعال (مخفی در لندینگ)</div>
                    <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      {landingSections.filter((s) => !s.is_enabled).length} بخش مخفی‌شده
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {landingSections.map((sec) => {
                  const meta = SECTION_METAS[sec.key] || {
                    icon: LayoutTemplate,
                    colorClass: 'text-cyan-600 bg-cyan-50 border-cyan-200',
                    badge: `بخش ${sec.display_order}`,
                    actionTab: null,
                    previewAnchor: '#',
                  };
                  const Icon = meta.icon;
                  const isToggling = togglingKey === sec.key;

                  return (
                    <div
                      key={sec.key}
                      className={`p-6 sm:p-7 rounded-3xl border-2 transition-all flex flex-col justify-between gap-5 sm:gap-6 ${
                        sec.is_enabled
                          ? 'bg-white dark:bg-slate-900 border-emerald-200/80 dark:border-emerald-800/60 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-700'
                          : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-85 hover:opacity-100'
                      }`}
                    >
                      {/* Card Top */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-13 h-13 rounded-2xl flex items-center justify-center border shrink-0 shadow-2xs ${meta.colorClass}`}
                            >
                              <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200">
                                  {meta.badge}
                                </span>
                                <code className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black border border-slate-200 dark:border-slate-700">
                                  {sec.key}
                                </code>
                              </div>
                              <h3 className="text-lg sm:text-xl lg:text-[1.35rem] font-black text-slate-900 dark:text-white mt-1.5">
                                {sec.title}
                              </h3>
                            </div>
                          </div>

                          {/* Status Badge */}
                          {sec.is_enabled ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/80 shrink-0">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>فعال و نمایان</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 shrink-0">
                              <EyeOff className="w-4 h-4 text-slate-500" />
                              <span>غیرفعال (مخفی)</span>
                            </span>
                          )}
                        </div>

                        {sec.subtitle && (
                          <div className="text-sm sm:text-base font-black text-cyan-800 dark:text-cyan-400">
                            {sec.subtitle}
                          </div>
                        )}

                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-semibold text-justify">
                          {sec.description}
                        </p>
                      </div>

                      {/* Card Bottom Controls */}
                      <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {/* Big Interactive Switch Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSection(sec.key)}
                          disabled={isToggling}
                          className={`w-full py-3.5 px-4.5 rounded-2xl transition-all flex items-center justify-between cursor-pointer border shadow-2xs active:scale-[0.99] ${
                            sec.is_enabled
                              ? 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-800'
                              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isToggling ? (
                              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-cyan-600" />
                            ) : sec.is_enabled ? (
                              <ToggleRight className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-400 dark:text-slate-500 shrink-0" />
                            )}
                            <span className="text-xs sm:text-sm font-black">
                              {isToggling
                                ? 'در حال ثبت تغییر وضعیت...'
                                : sec.is_enabled
                                ? 'وضعیت در لندینگ: روشن (در حال نمایش)'
                                : 'وضعیت در لندینگ: خاموش (مخفی از دید کاربران)'}
                            </span>
                          </div>

                          <span
                            className={`text-xs font-black px-3 py-1.5 rounded-lg transition-colors ${
                              sec.is_enabled
                                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {sec.is_enabled ? 'کلیک جهت غیرفعال‌سازی' : 'کلیک جهت فعال‌سازی'}
                          </span>
                        </button>

                        {/* Navigation / Action Sub-bar */}
                        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                          {meta.actionTab ? (
                            <button
                              type="button"
                              onClick={() => setActiveTab(meta.actionTab)}
                              className="text-cyan-700 dark:text-cyan-400 hover:underline font-black inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>مدیریت و ویرایش محتوای این بخش</span>
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs font-bold">بخش ساختاری لندینگ</span>
                          )}

                          <a
                            href={`/${meta.previewAnchor}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold inline-flex items-center gap-1.5 text-xs sm:text-sm transition-colors"
                          >
                            <span>پیش‌نمایش بخش در سایت</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 1: POOLS (استخرها و مجموعه‌های آبی)
              ========================================================================= */}
          {activeTab === 'pools' && (
            <div className="space-y-6">
              {renderSectionStatusBanner('pools', 'استخرهای طرف قرارداد در قزوین')}

              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <Waves className="w-6 h-6 text-cyan-600 shrink-0" />
                    <span>مدیریت استخرهای صفحه لندینگ</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    در کارت اولیه: عکس پوستر، اسم استخر و لوکیشن نمایش داده می‌شود. در جزئیات بیشتر: عکس‌های تکمیلی، ابعاد و توضیحات کامل استخر قرار می‌گیرد.
                  </p>
                </div>
                <Button onClick={handleOpenCreatePool} className="gap-2 text-xs sm:text-sm font-black py-2.5 px-4 shadow-xs shrink-0">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>افزودن استخر جدید</span>
                </Button>
              </div>

              {pools.length === 0 ? (
                <EmptyState
                  title="استخری ثبت نشده است"
                  description="برای نمایش استخرها در صفحه اصلی، استخر جدید اضافه کنید."
                  actionLabel="افزودن استخر"
                  onAction={handleOpenCreatePool}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pools.map((pool) => {
                    const poster = pool.poster_image_url || pool.poster_image || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';
                    return (
                      <article
                        key={pool.id}
                        className="group bg-white dark:bg-slate-900 rounded-3xl border-2 border-cyan-100 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Poster Photo */}
                          <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                            <img
                              src={poster}
                              alt={pool.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 right-3 flex items-center gap-2">
                              <span className="px-3 py-1 bg-white/95 dark:bg-slate-900/90 text-cyan-900 dark:text-cyan-300 text-xs font-black rounded-lg border border-cyan-200 dark:border-slate-700 shadow-xs">
                                اولویت {pool.display_order}
                              </span>
                              {pool.is_active ? (
                                <span className="px-2.5 py-1 bg-emerald-500/90 text-white text-xs font-black rounded-md">
                                  فعال
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-500/90 text-white text-xs font-black rounded-md">
                                  عدم نمایش
                                </span>
                              )}
                            </div>
                            {pool.gallery_images && pool.gallery_images.length > 0 && (
                              <div className="absolute bottom-3 left-3">
                                <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white text-xs font-black rounded-lg border border-white/20 flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>{pool.gallery_images.length} عکس بیشتر</span>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-5 sm:p-6 space-y-3">
                            <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white leading-snug">
                              {pool.name}
                            </h3>

                            <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold">
                              <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 leading-relaxed">{pool.location}</span>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                              {pool.description}
                            </p>

                            {pool.dimensions && (
                              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>ابعاد: {pool.dimensions}</span>
                                <span>عمق: {pool.depth || 'استاندارد'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-5 sm:p-6 pt-0 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewPool(pool)}
                            className="flex-1 text-xs sm:text-sm font-bold gap-1.5 py-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>پیش‌نمایش جزئیات</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditPool(pool)}
                            className="text-xs sm:text-sm font-bold py-2"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePool(pool.slug)}
                            className="text-xs sm:text-sm font-bold py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: COACHES & ORDERING (کادر مربیان و چینش)
              ========================================================================= */}
          {activeTab === 'coaches' && (
            <div className="space-y-6">
              {renderSectionStatusBanner('coaches', 'کادر مربیان رسمی فدراسیون')}

              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <Users2 className="w-6 h-6 text-teal-600 shrink-0" />
                    <span>کادر مربیان و چینش ترتیب نمایش در لندینگ</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    ترتیب نمایش مربیان در صفحه اصلی را مشخص کنید. مربیان به تفکیک دو تب مربیان مرد و مربیان زن دسته‌بندی می‌شوند.
                  </p>
                </div>

                <Button
                  onClick={handleSaveCoachOrders}
                  disabled={coachSavingOrder}
                  className="gap-2 text-xs sm:text-sm font-black py-2.5 px-5 bg-teal-600 hover:bg-teal-700 shadow-xs shrink-0"
                >
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{coachSavingOrder ? 'در حال ذخیره...' : 'ذخیره ترتیب چینش مربیان'}</span>
                </Button>
              </div>

              {/* Gender Tabs */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setCoachGenderTab('MALE')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                    coachGenderTab === 'MALE'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>مربیان مرد (آقایان)</span>
                  <span className="mr-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    {coachOrderList.filter(isMaleCoach).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoachGenderTab('FEMALE')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                    coachGenderTab === 'FEMALE'
                      ? 'bg-white dark:bg-slate-700 text-pink-700 dark:text-pink-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>مربیان زن (بانوان)</span>
                  <span className="mr-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-300">
                    {coachOrderList.filter(isFemaleCoach).length}
                  </span>
                </button>
              </div>

              {/* Coach Reorder Cards */}
              <div className="space-y-3.5">
                {filteredCoaches.length === 0 ? (
                  <p className="text-center py-12 text-sm text-slate-500 font-semibold">
                    مربی در این دسته‌بندی ثبت نشده است.
                  </p>
                ) : (
                  filteredCoaches.map((coach, index) => (
                    <div
                      key={coach.id}
                      className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        {/* Display Order Badge */}
                        <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 font-black flex items-center justify-center border border-cyan-200/70 text-base shrink-0">
                          #{index + 1}
                        </div>

                        {/* Avatar */}
                        <div className="w-13 h-13 rounded-full overflow-hidden bg-slate-100 border-2 border-teal-400/50 shrink-0">
                          <img
                            src={
                              coach.avatar ||
                              (isFemaleCoach(coach)
                                ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
                                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80')
                            }
                            alt={coach.full_name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Information */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                              {coach.full_name}
                            </h3>
                            <Badge variant={isFemaleCoach(coach) ? 'warning' : 'info'}>
                              {isFemaleCoach(coach) ? 'مربی خانم' : 'مربی آقا'}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold line-clamp-1">
                            {coach.specialties || 'کرال سینه، شنای پروانه، نجات غریق'}
                          </p>
                        </div>
                      </div>

                      {/* Reorder and Edit Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={index === 0}
                          onClick={() => handleMoveCoach(index, -1)}
                          title="انتقال به ردیف بالاتر"
                          className="h-9 w-9 p-0"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={index === filteredCoaches.length - 1}
                          onClick={() => handleMoveCoach(index, 1)}
                          title="انتقال به ردیف پایین‌تر"
                          className="h-9 w-9 p-0"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditCoach(coach)}
                          className="gap-1.5 text-xs sm:text-sm font-bold py-2 px-3"
                        >
                          <Edit className="w-4 h-4" />
                          <span>ویرایش مشخصات</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: NEWS & ARTICLES (اخبار و رویدادها)
              ========================================================================= */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              {renderSectionStatusBanner('news', 'اخبار، رویدادها و اطلاعیه‌ها')}

              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <Newspaper className="w-6 h-6 text-amber-600 shrink-0" />
                    <span>مدیریت اخبار، پوستر و تصاویر شرح خبر</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    امکان بارگذاری عکس پوستر خبر، عکس‌های مرتبط با شرح خبر در مدال، و متن کامل اطلاعیه با قالب‌بندی مرتب.
                  </p>
                </div>
                <Button onClick={handleOpenCreateNews} className="gap-2 text-xs sm:text-sm font-black py-2.5 px-4 shadow-xs shrink-0">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>انتشار خبر جدید</span>
                </Button>
              </div>

              {news.length === 0 ? (
                <EmptyState
                  title="خبری ثبت نشده است"
                  description="جهت نمایش در صفحه اصلی خبر جدید ثبت کنید."
                  actionLabel="ارسال خبر"
                  onAction={handleOpenCreateNews}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {news.map((item) => {
                    const poster = item.image_url || item.image || 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80';
                    return (
                      <article
                        key={item.id}
                        className="group bg-white dark:bg-slate-900 rounded-3xl border-2 border-cyan-100 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* News Poster Photo */}
                          <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                            <img
                              src={poster}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 right-3">
                              <span className="px-3 py-1 bg-white/95 dark:bg-slate-900/90 text-cyan-900 dark:text-cyan-300 text-xs font-black rounded-lg border border-cyan-200 dark:border-slate-700 shadow-xs">
                                {categoryLabels[item.category] || 'اطلاعیه'}
                              </span>
                            </div>
                            {item.detail_images && item.detail_images.length > 0 && (
                              <div className="absolute bottom-3 left-3">
                                <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white text-xs font-black rounded-lg border border-white/20 flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>{item.detail_images.length} تصویر شرح</span>
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-5 sm:p-6 space-y-3">
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-cyan-800 dark:text-cyan-300 font-mono font-bold">
                              <Clock className="w-4 h-4 text-teal-600" />
                              <span>{new Date(item.publish_at).toLocaleDateString('fa-IR')}</span>
                            </div>
                            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug group-hover:text-cyan-600 transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium">
                              {item.summary || item.body}
                            </p>
                          </div>
                        </div>

                        <div className="p-5 sm:p-6 pt-0 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewNews(item)}
                            className="flex-1 text-xs sm:text-sm font-bold gap-1.5 py-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>مشاهده متن و تصاویر</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditNews(item)}
                            className="text-xs sm:text-sm font-bold py-2"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteNews(item.slug)}
                            className="text-xs sm:text-sm font-bold py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 4: COURSES (دوره‌های لندینگ)
              ========================================================================= */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              {renderSectionStatusBanner('courses', 'دوره‌ها و کلاس‌های آموزشی شنا')}

              <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <BookOpen className="w-6 h-6 text-sky-600 shrink-0" />
                    <span>دوره‌های فعال در صفحه لندینگ</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                    این دوره‌ها مستقیماً در گردونه کلاس‌های صفحه اصلی سایت همراه با ظرفیت باقی‌مانده و سرفصل‌ها به نمایش درمی‌آیند.
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = '/admin/courses'}
                  className="gap-2 text-xs sm:text-sm font-black py-2.5 px-4 bg-sky-600 hover:bg-sky-700 shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>مدیریت کامل دوره‌ها</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="px-3 py-1 text-xs font-black text-teal-800 bg-teal-50 dark:bg-teal-950/60 rounded-lg border border-teal-200/60">
                          {course.status === 'ACTIVE' ? 'ثبت‌نام فعال' : 'پیش‌نویس'}
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-black text-slate-600 dark:text-slate-400">
                          {course.sessions_count} جلسه
                        </span>
                      </div>

                      <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                        {course.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">
                        {course.what_you_learn || course.description || 'آموزش ۴ شنا، اصلاح تکنیک، تنفس و آمادگی مسابقات'}
                      </p>
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm font-black text-sky-700 dark:text-sky-300">
                      <span>شهریه: {Number(course.base_price || 0).toLocaleString('fa-IR')} تومان</span>
                      <span>سقف اقساط: {course.installments_count || 1} قسط</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT POOL
          ========================================================================= */}
      <Modal
        isOpen={poolModalOpen}
        onClose={() => setPoolModalOpen(false)}
        title={editingPool ? `ویرایش استخر: ${editingPool.name}` : 'افزودن استخر جدید به سایت'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handlePoolSubmit} className="space-y-4">
          {/* Pool Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              نام استخر * (مثال: استخر ۵۰ متری المپیک قزوین)
            </label>
            <input
              type="text"
              required
              value={poolForm.name}
              onChange={(e) => setPoolForm({ ...poolForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              لوکیشن و آدرس استخر * (در کارت اولیه نمایش داده می‌شود)
            </label>
            <input
              type="text"
              required
              value={poolForm.location}
              onChange={(e) => setPoolForm({ ...poolForm, location: e.target.value })}
              placeholder="مثال: قزوین، شهرک کوثر، مجتمع ورزشی المپیک"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Poster Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عکس پوستر استخر (کارت اولیه)
            </label>
            <div className="flex items-center gap-4">
              {poolPosterPreview && (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border shrink-0">
                  <img src={poolPosterPreview} alt="پوستر استخر" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setPoolPosterFile(file);
                    setPoolPosterPreview(URL.createObjectURL(file));
                  }
                }}
                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
              />
            </div>
          </div>

          {/* Dimensions, Depth, Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ابعاد کاسه استخر
              </label>
              <input
                type="text"
                value={poolForm.dimensions}
                onChange={(e) => setPoolForm({ ...poolForm, dimensions: e.target.value })}
                placeholder="مثال: ۵۰ در ۲۵ متر"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                عمق استخر
              </label>
              <input
                type="text"
                value={poolForm.depth}
                onChange={(e) => setPoolForm({ ...poolForm, depth: e.target.value })}
                placeholder="مثال: ۱.۲۰ الی ۳.۸۰ متر"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ترتیب نمایش
              </label>
              <input
                type="number"
                min="1"
                value={poolForm.display_order}
                onChange={(e) => setPoolForm({ ...poolForm, display_order: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات و مشخصات استخر * (نمایش در جزئیات بیشتر)
            </label>
            <textarea
              rows={3}
              required
              value={poolForm.description}
              onChange={(e) => setPoolForm({ ...poolForm, description: e.target.value })}
              placeholder="توضیحات سیستم تصفیه آب، دمای آب، کیفیت محیط و ویژگی‌های استخر..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Facilities */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              امکانات رفاهی استخر (با کاما جدا کنید)
            </label>
            <input
              type="text"
              value={poolForm.facilities}
              onChange={(e) => setPoolForm({ ...poolForm, facilities: e.target.value })}
              placeholder="سونا خشک، سونای بخار، جکوزی، حوضچه آب سرد، پارکینگ، بوفه"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Gallery / More Photos Upload */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              عکس‌های بیشتر مربوط به استخر (نمایش در جزئیات)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setPoolGalleryFiles(files);
              }}
              className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
            {poolGalleryFiles.length > 0 && (
              <p className="text-[11px] text-teal-600 font-bold">
                {poolGalleryFiles.length} عکس برای بارگذاری انتخاب شد.
              </p>
            )}

            {/* Existing Gallery Images */}
            {editingPool?.gallery_images && editingPool.gallery_images.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] text-slate-500">تصاویر ذخیره‌شده قبلی:</span>
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {editingPool.gallery_images.map((img) => (
                    <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={img.image_url || img.image} alt="تصویر استخر" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeletePoolGalleryImage(img.id)}
                        className="absolute top-0.5 right-0.5 bg-red-600/90 text-white p-0.5 rounded-full hover:bg-red-700"
                        title="حذف این تصویر"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setPoolModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={poolSubmitting}>
              {poolSubmitting ? 'در حال ذخیره...' : editingPool ? 'به‌روزرسانی استخر' : 'ثبت استخر'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: EDIT COACH
          ========================================================================= */}
      <Modal
        isOpen={coachModalOpen}
        onClose={() => setCoachModalOpen(false)}
        title={`ویرایش مربی: ${editingCoach?.full_name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCoachSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">نام</label>
              <input
                type="text"
                required
                value={coachForm.first_name}
                onChange={(e) => setCoachForm({ ...coachForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">نام خانوادگی</label>
              <input
                type="text"
                required
                value={coachForm.last_name}
                onChange={(e) => setCoachForm({ ...coachForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">جنسیت مربی</label>
              <select
                value={coachForm.gender}
                onChange={(e) => setCoachForm({ ...coachForm, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
              >
                <option value="MALE">مربی مرد (آقا)</option>
                <option value="FEMALE">مربی زن (خانم)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ترتیب نمایش</label>
              <input
                type="number"
                min="1"
                value={coachForm.display_order}
                onChange={(e) => setCoachForm({ ...coachForm, display_order: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">عکس پرسنلی / آواتار</label>
            <div className="flex items-center gap-4">
              {coachAvatarPreview && (
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border shrink-0">
                  <img src={coachAvatarPreview} alt="آواتار مربی" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setCoachAvatarFile(file);
                    setCoachAvatarPreview(URL.createObjectURL(file));
                  }
                }}
                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">تخصص‌ها</label>
            <input
              type="text"
              value={coachForm.specialties}
              onChange={(e) => setCoachForm({ ...coachForm, specialties: e.target.value })}
              placeholder="کرال سینه، شنای پروانه، نجات غریق درجه ۱"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">رزومه و بیوگرافی</label>
            <textarea
              rows={3}
              value={coachForm.bio}
              onChange={(e) => setCoachForm({ ...coachForm, bio: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setCoachModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={coachSubmitting}>
              {coachSubmitting ? 'در حال ثبت...' : 'ذخیره مشخصات'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: ADD / EDIT NEWS (با عکس پوستر و عکس‌های شرح خبر)
          ========================================================================= */}
      <Modal
        isOpen={newsModalOpen}
        onClose={() => setNewsModalOpen(false)}
        title={editingNews ? `ویرایش خبر: ${editingNews.title}` : 'ارسال خبر و اطلاعیه جدید'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleNewsSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان خبر *
            </label>
            <input
              type="text"
              required
              value={newsForm.title}
              onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
            />
          </div>

          {/* Poster Image */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عکس پوستر خبر (نمایش در کارت خبر)
            </label>
            <div className="flex items-center gap-4">
              {newsPosterPreview && (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border shrink-0">
                  <img src={newsPosterPreview} alt="پوستر خبر" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setNewsPosterFile(file);
                    setNewsPosterPreview(URL.createObjectURL(file));
                  }
                }}
                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                دسته‌بندی موضوعی
              </label>
              <select
                value={newsForm.category}
                onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
              >
                <option value="GENERAL">عمومی و اطلاعیه‌ها</option>
                <option value="COMPETITIONS">مسابقات و رویدادها</option>
                <option value="CLASSES">دوره‌ها و کلاس‌ها</option>
                <option value="HEALTH">آموزش و بهداشت استخر</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                وضعیت انتشار
              </label>
              <select
                value={newsForm.status}
                onChange={(e) => setNewsForm({ ...newsForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
              >
                <option value="PUBLISHED">منتشرشده در سایت</option>
                <option value="DRAFT">پیش‌نویس</option>
                <option value="ARCHIVED">بایگانی‌شده</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              خلاصه خبر (نمایش در کارت)
            </label>
            <textarea
              rows={2}
              value={newsForm.summary}
              onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
              placeholder="یک یا دو خط خلاصه..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              متن کامل خبر *
            </label>
            <textarea
              rows={5}
              required
              value={newsForm.body}
              onChange={(e) => setNewsForm({ ...newsForm, body: e.target.value })}
              placeholder="متن کامل گزارش و خبر..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
            />
          </div>

          {/* Description Images (عکس‌های مربوط به شرح اخبار) */}
          <div className="space-y-2 pt-2 border-t">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              عکس‌های مربوط به شرح خبر (گالری تکمیلی در مشاهده خبر)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setNewsDetailFiles(files);
              }}
              className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
            />
            {newsDetailFiles.length > 0 && (
              <p className="text-[11px] text-amber-600 font-bold">
                {newsDetailFiles.length} عکس برای شرح خبر انتخاب شد.
              </p>
            )}

            {/* Existing detail images */}
            {editingNews?.detail_images && editingNews.detail_images.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] text-slate-500">تصاویر شرح خبر قبلی:</span>
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {editingNews.detail_images.map((img) => (
                    <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={img.image_url || img.image} alt="تصویر شرح" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeleteNewsDetailImage(img.id)}
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700"
                        title="حذف این تصویر"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setNewsModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={newsSubmitting}>
              {newsSubmitting ? 'در حال ثبت...' : editingNews ? 'به‌روزرسانی خبر' : 'انتشار خبر'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: PREVIEW POOL DETAILS (مشابه صفحه لندینگ)
          ========================================================================= */}
      <Modal
        isOpen={!!previewPool}
        onClose={() => setPreviewPool(null)}
        title={previewPool?.name || 'جزئیات استخر'}
        maxWidth="max-w-3xl"
      >
        {previewPool && (
          <div className="space-y-5 text-right">
            <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-slate-950">
              <img
                src={previewPool.poster_image_url || previewPool.poster_image || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80'}
                alt={previewPool.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <span className="px-3.5 py-1.5 bg-slate-900/90 text-cyan-300 text-xs sm:text-sm font-black rounded-lg border border-cyan-400/30">
                  {previewPool.dimensions || 'استخر استاندارد'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{previewPool.name}</h3>
              <p className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bold">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{previewPool.location}</span>
              </p>
            </div>

            <div className="p-4.5 bg-cyan-50/60 dark:bg-slate-800/60 rounded-xl border border-cyan-100 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-semibold">
              {previewPool.description}
            </div>

            {previewPool.facilities && (
              <div className="space-y-1.5">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">امکانات و ویژگی‌ها:</span>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{previewPool.facilities}</p>
              </div>
            )}

            {/* Gallery of more photos */}
            {previewPool.gallery_images && previewPool.gallery_images.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">عکس‌های بیشتر مربوط به استخر:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {previewPool.gallery_images.map((img) => (
                    <div key={img.id} className="rounded-xl overflow-hidden aspect-video bg-slate-100 border">
                      <img src={img.image_url || img.image} alt="عکس استخر" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t">
              <Button variant="outline" onClick={() => setPreviewPool(null)}>
                بستن پنجره
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =========================================================================
          MODAL: PREVIEW NEWS (مشابه صفحه لندینگ)
          ========================================================================= */}
      <Modal
        isOpen={!!previewNews}
        onClose={() => setPreviewNews(null)}
        title={previewNews?.title || 'پیش‌نمایش خبر'}
        maxWidth="max-w-3xl"
      >
        {previewNews && (
          <div className="space-y-5 text-right">
            <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-slate-950">
              <img
                src={previewNews.image_url || previewNews.image || 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80'}
                alt={previewNews.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <span className="px-3.5 py-1.5 bg-slate-900/90 text-amber-300 text-xs sm:text-sm font-black rounded-lg border border-amber-400/30">
                  {categoryLabels[previewNews.category]}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                {previewNews.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-mono font-bold">
                تاریخ انتشار: {new Date(previewNews.publish_at).toLocaleDateString('fa-IR')}
              </p>
            </div>

            {previewNews.summary && (
              <p className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-bold leading-relaxed">
                {previewNews.summary}
              </p>
            )}

            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed sm:leading-loose whitespace-pre-wrap font-medium">
              {previewNews.body}
            </div>

            {/* Gallery of description images */}
            {previewNews.detail_images && previewNews.detail_images.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">عکس‌های مربوط به شرح خبر:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {previewNews.detail_images.map((img) => (
                    <div key={img.id} className="rounded-xl overflow-hidden aspect-video bg-slate-100 border">
                      <img src={img.image_url || img.image} alt="عکس شرح خبر" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t">
              <Button variant="outline" onClick={() => setPreviewNews(null)}>
                بستن پنجره
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
