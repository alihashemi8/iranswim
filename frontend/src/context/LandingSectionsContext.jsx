import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export const DEFAULT_LANDING_SECTIONS = [
  {
    key: 'hero',
    title: 'بنر اصلی و ورودی لندینگ',
    subtitle: 'آموزش اصولی شنا از مبتدی تا پیشرفته در قزوین',
    description: 'سربرگ لندینگ، تیتر اصلی، دکمه‌های ثبت‌نام، شماره تماس و جلوه بصری شناگر.',
    display_order: 1,
    is_enabled: true,
  },
  {
    key: 'about',
    title: 'ویژگی‌ها و مزایای آموزشگاه',
    subtitle: 'چرا مدرسه شنای ایران؟',
    description: 'کارت‌های سه‌گانه متد آموزش بدون ترس، اصلاح قامت، ساختار تنفس و استانداردهای فدراسیون.',
    display_order: 2,
    is_enabled: true,
  },
  {
    key: 'courses',
    title: 'دوره‌ها و کلاس‌های آموزشی شنا',
    subtitle: 'برنامه آموزشی ترم جاری',
    description: 'کاروسل دوره‌های فعال، ظرفیت‌های باقی‌مانده، رده سنی و شهریه ثبت‌نام.',
    display_order: 3,
    is_enabled: true,
  },
  {
    key: 'pools',
    title: 'استخرهای طرف قرارداد در قزوین',
    subtitle: 'مجموعه‌های آبی و استخرهای استاندارد قزوین',
    description: 'لیست استخرهای تحت پوشش قزوین، تصاویر گالری، ابعاد، عمق، مشخصات و آدرس دقیق.',
    display_order: 4,
    is_enabled: true,
  },
  {
    key: 'facilities',
    title: 'امکانات و شرایط بهداشتی استخرها',
    subtitle: 'محیط استخر و بهداشت آب',
    description: 'کارت‌های تصفیه مداوم، وسایل کمک‌آموزشی استاندارد، سونا و جکوزی و سانس‌های تفکیک‌شده.',
    display_order: 5,
    is_enabled: true,
  },
  {
    key: 'coaches',
    title: 'کادر مربیان رسمی فدراسیون',
    subtitle: 'مربیان باسابقه و رسمی مدرسه شنای ایران',
    description: 'کارت‌های پروفایل مربیان، فیلتر مربیان خانم و آقا، مدارک رسمی و سوابق ورزشی.',
    display_order: 6,
    is_enabled: true,
  },
  {
    key: 'news',
    title: 'اخبار، رویدادها و اطلاعیه‌ها',
    subtitle: 'تازه‌ترین رویدادها و اطلاعیه‌های مدرسه شنای ایران',
    description: 'اطلاعیه‌ها، تقویم زمان‌بندی ترم‌ها، آزمون‌های استعدادیابی و اخبار آموزشگاه.',
    display_order: 7,
    is_enabled: true,
  },
  {
    key: 'cta',
    title: 'بخش دعوت به اقدام و ثبت‌نام (CTA)',
    subtitle: 'آماده‌اید شنا را اصولی و استاندارد شروع کنید؟',
    description: 'باکس بنر انتهای صفحه، دکمه سریع ثبت‌نام در دوره‌ها و تماس با پذیرش آموزشگاه.',
    display_order: 8,
    is_enabled: true,
  },
];

const LandingSectionsContext = createContext(null);

export const LandingSectionsProvider = ({ children }) => {
  const [sections, setSections] = useState(DEFAULT_LANDING_SECTIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/content/landing-sections/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSections(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch landing sections from API, fallback to default:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();

    // Listen to custom updates across components or window
    const handleUpdate = () => {
      fetchSections();
    };
    window.addEventListener('landing_sections_updated', handleUpdate);
    return () => window.removeEventListener('landing_sections_updated', handleUpdate);
  }, [fetchSections]);

  const isSectionEnabled = useCallback(
    (key) => {
      const found = sections.find((s) => s.key === key);
      return found ? Boolean(found.is_enabled) : true;
    },
    [sections]
  );

  const toggleSection = async (key) => {
    // Optimistic local update
    const previousSections = [...sections];
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, is_enabled: !s.is_enabled } : s))
    );

    try {
      const res = await api.post(`/content/landing-sections/${key}/toggle/`);
      if (res.data) {
        setSections((prev) =>
          prev.map((s) => (s.key === key ? res.data : s))
        );
      }
      window.dispatchEvent(new CustomEvent('landing_sections_updated'));
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Failed to toggle landing section:', err);
      // Revert on error
      setSections(previousSections);
      return {
        success: false,
        error: err.response?.data?.detail || 'خطا در تغییر وضعیت بخش لندینگ.',
      };
    }
  };

  const setAllSections = async (enabled) => {
    const previousSections = [...sections];
    const newSections = sections.map((s) => ({ ...s, is_enabled: enabled }));
    setSections(newSections);

    try {
      const payload = {
        sections: newSections.map((s) => ({ key: s.key, is_enabled: enabled })),
      };
      const res = await api.put('/content/landing-sections/', payload);
      if (Array.isArray(res.data)) {
        setSections(res.data);
      }
      window.dispatchEvent(new CustomEvent('landing_sections_updated'));
      return { success: true };
    } catch (err) {
      console.error('Failed to bulk update landing sections:', err);
      setSections(previousSections);
      return {
        success: false,
        error: err.response?.data?.detail || 'خطا در به‌روزرسانی گروهی بخش‌ها.',
      };
    }
  };

  return (
    <LandingSectionsContext.Provider
      value={{
        sections,
        loading,
        error,
        isSectionEnabled,
        toggleSection,
        setAllSections,
        reloadSections: fetchSections,
      }}
    >
      {children}
    </LandingSectionsContext.Provider>
  );
};

export const useLandingSections = () => {
  const context = useContext(LandingSectionsContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      sections: DEFAULT_LANDING_SECTIONS,
      loading: false,
      error: null,
      isSectionEnabled: (key) => {
        const found = DEFAULT_LANDING_SECTIONS.find((s) => s.key === key);
        return found ? Boolean(found.is_enabled) : true;
      },
      toggleSection: async () => ({ success: false, error: 'No provider' }),
      setAllSections: async () => ({ success: false, error: 'No provider' }),
      reloadSections: () => {},
    };
  }
  return context;
};
