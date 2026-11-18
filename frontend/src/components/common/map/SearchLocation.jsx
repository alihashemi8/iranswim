import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2, ChevronLeft } from 'lucide-react';

const DIGITS_MAP = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

const ARABIC_TO_PERSIAN = {
  'ي': 'ی', 'ك': 'ک', 'ة': 'ه', 'ۀ': 'ه', 'ؤ': 'و',
  'إ': 'ا', 'أ': 'ا', 'آ': 'ا', 'ئ': 'ی',
};

const DIACRITICS_REGEX = /[\u064B-\u065F\u0670]/g;

function normalizePersian(text) {
  if (!text) return '';
  let str = String(text);
  for (const [ar, en] of Object.entries(DIGITS_MAP)) {
    str = str.replaceAll(ar, en);
  }
  for (const [ar, fa] of Object.entries(ARABIC_TO_PERSIAN)) {
    str = str.replaceAll(ar, fa);
  }
  str = str.replace(DIACRITICS_REGEX, '');
  str = str.replace(/\u200c/g, ' ');
  str = str.replace(/[,،\-_.\\()[\]+!؟?«»"':#@]+/g, ' ');
  return str.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Comprehensive local Iranian locations for sub-5ms instant matching
const IRAN_MAJOR_PLACES = [
  // Tehran landmarks & districts
  { title: 'میدان آزادی', subtitle: 'تهران، منطقه ۹', lat: 35.6997, lng: 51.3375, keywords: ['ازادی', 'میدان ازادی', 'تهران', 'برج ازادی'] },
  { title: 'میدان انقلاب اسلامی', subtitle: 'تهران، منطقه ۶ و ۱۱', lat: 35.7008, lng: 51.3912, keywords: ['انقلاب', 'میدان انقلاب', 'تهران'] },
  { title: 'میدان ولیعصر', subtitle: 'تهران، منطقه ۶', lat: 35.7115, lng: 51.4070, keywords: ['ولیعصر', 'میدان ولیعصر', 'تهران'] },
  { title: 'میدان ونک', subtitle: 'تهران، منطقه ۳', lat: 35.7592, lng: 51.4057, keywords: ['ونک', 'میدان ونک', 'تهران'] },
  { title: 'تجریش', subtitle: 'تهران، منطقه ۱، شمیرانات', lat: 35.8036, lng: 51.4283, keywords: ['تجریش', 'میدان تجریش', 'شمیران'] },
  { title: 'سعادت‌آباد', subtitle: 'تهران، منطقه ۲', lat: 35.7836, lng: 51.3789, keywords: ['سعادت اباد', 'سعادت آباد', 'تهران'] },
  { title: 'شهرک غرب', subtitle: 'تهران، منطقه ۲', lat: 35.7538, lng: 51.3688, keywords: ['شهرک غرب', 'قدس', 'تهران'] },
  { title: 'پونک', subtitle: 'تهران، منطقه ۵', lat: 35.7667, lng: 51.3411, keywords: ['پونک', 'میدان پونک', 'تهران'] },
  { title: 'تهرانپارس', subtitle: 'تهران، منطقه ۴ و ۸', lat: 35.7289, lng: 51.5294, keywords: ['تهرانپارس', 'فلکه اول', 'فلکه دوم', 'تهران'] },
  { title: 'پاسداران', subtitle: 'تهران، منطقه ۳ و ۴', lat: 35.7725, lng: 51.4658, keywords: ['پاسداران', 'سلطنت اباد', 'تهران'] },
  { title: 'صادقیه (آریاشهر)', subtitle: 'تهران، منطقه ۲ و ۵', lat: 35.7208, lng: 51.3350, keywords: ['صادقیه', 'اریاشهر', 'فلکه صادقیه'] },
  { title: 'ستارخان', subtitle: 'تهران، منطقه ۲', lat: 35.7175, lng: 51.3644, keywords: ['ستارخان', 'خیابان ستارخان', 'تهران'] },
  { title: 'هفت تیر', subtitle: 'تهران، منطقه ۶ و ۷', lat: 35.7170, lng: 51.4247, keywords: ['هفت تیر', 'میدان هفت تیر', 'تهران'] },
  { title: 'میدان رسالت', subtitle: 'تهران، منطقه ۴ و ۸', lat: 35.7336, lng: 51.5033, keywords: ['رسالت', 'میدان رسالت', 'تهران'] },
  { title: 'نارمک', subtitle: 'تهران، منطقه ۸', lat: 35.7280, lng: 51.4980, keywords: ['نارمک', 'هفت حوض', 'تهران'] },
  { title: 'جنت‌آباد', subtitle: 'تهران، منطقه ۵', lat: 35.7483, lng: 51.3125, keywords: ['جنت اباد', 'جنت آباد', 'تهران'] },
  { title: 'مرزداران', subtitle: 'تهران، منطقه ۲', lat: 35.7342, lng: 51.3528, keywords: ['مرزداران', 'بلوار مرزداران', 'تهران'] },
  { title: 'نیاوران', subtitle: 'تهران، منطقه ۱', lat: 35.8190, lng: 51.4680, keywords: ['نیاوران', 'کاخ نیاوران', 'تهران'] },
  { title: 'الهیه', subtitle: 'تهران، منطقه ۱', lat: 35.7890, lng: 51.4240, keywords: ['الهیه', 'فرشته', 'تهران'] },
  { title: 'قیطریه', subtitle: 'تهران، منطقه ۱', lat: 35.7925, lng: 51.4420, keywords: ['قیطریه', 'پارک قیطریه', 'تهران'] },
  { title: 'سیدخندان', subtitle: 'تهران، منطقه ۷', lat: 35.7420, lng: 51.4460, keywords: ['سیدخندان', 'پل سیدخندان', 'تهران'] },

  // Alborz / Karaj
  { title: 'کرج (مرکز البرز)', subtitle: 'استان البرز، شهر کرج', lat: 35.8327, lng: 50.9915, keywords: ['کرج', 'البرز', 'مرکز کرج'] },
  { title: 'گوهردشت (رجایی‌شهر)', subtitle: 'کرج، استان البرز', lat: 35.8560, lng: 50.9850, keywords: ['گوهردشت', 'رجایی شهر', 'کرج'] },
  { title: 'مهرشهر', subtitle: 'کرج، استان البرز', lat: 35.8050, lng: 50.9120, keywords: ['مهرشهر', 'چهارباندی', 'کرج'] },
  { title: 'عظیمیه', subtitle: 'کرج، استان البرز', lat: 35.8450, lng: 51.0150, keywords: ['عظیمیه', 'میدان مهران', 'کرج'] },
  { title: 'جهانشهر', subtitle: 'کرج، استان البرز', lat: 35.8280, lng: 50.9820, keywords: ['جهانشهر', 'میدان گلها', 'کرج'] },
  { title: 'فردیس', subtitle: 'استان البرز، فردیس', lat: 35.7250, lng: 50.9750, keywords: ['فردیس', 'فلکه اول فردیس', 'کرج'] },

  // Provincial Centers
  { title: 'تهران', subtitle: 'پایتخت ایران', lat: 35.6892, lng: 51.3890, keywords: ['تهران', 'پایتخت'] },
  { title: 'مشهد', subtitle: 'مرکز استان خراسان رضوی', lat: 36.2972, lng: 59.6067, keywords: ['مشهد', 'خراسان رضوی'] },
  { title: 'اصفهان', subtitle: 'مرکز استان اصفهان', lat: 32.6546, lng: 51.6680, keywords: ['اصفهان', 'نصف جهان'] },
  { title: 'شیراز', subtitle: 'مرکز استان فارس', lat: 29.5918, lng: 52.5837, keywords: ['شیراز', 'فارس'] },
  { title: 'تبریز', subtitle: 'مرکز استان آذربایجان شرقی', lat: 38.0800, lng: 46.2919, keywords: ['تبریز', 'اذربایجان شرقی'] },
  { title: 'اهواز', subtitle: 'مرکز استان خوزستان', lat: 31.3183, lng: 48.6706, keywords: ['اهواز', 'خوزستان'] },
  { title: 'قم', subtitle: 'مرکز استان قم', lat: 34.6401, lng: 50.8764, keywords: ['قم'] },
  { title: 'رشت', subtitle: 'مرکز استان گیلان', lat: 37.2809, lng: 49.5924, keywords: ['رشت', 'گیلان'] },
  { title: 'کرمانشاه', subtitle: 'مرکز استان کرمانشاه', lat: 34.3142, lng: 47.0650, keywords: ['کرمانشاه'] },
  { title: 'ارومیه', subtitle: 'مرکز استان آذربایجان غربی', lat: 37.5527, lng: 45.0761, keywords: ['ارومیه', 'اورمیه'] },
  { title: 'یزد', subtitle: 'مرکز استان یزد', lat: 31.8974, lng: 54.3569, keywords: ['یزد'] },
  { title: 'کرمان', subtitle: 'مرکز استان کرمان', lat: 30.2839, lng: 57.0834, keywords: ['کرمان'] },
  { title: 'همدان', subtitle: 'مرکز استان همدان', lat: 34.7989, lng: 48.5150, keywords: ['همدان'] },
  { title: 'اراک', subtitle: 'مرکز استان مرکزی', lat: 34.0954, lng: 49.7013, keywords: ['اراک', 'مرکزی'] },
  { title: 'قزوین', subtitle: 'مرکز استان قزوین', lat: 36.2797, lng: 50.0049, keywords: ['قزوین'] },
  { title: 'ساری', subtitle: 'مرکز استان مازندران', lat: 36.5659, lng: 53.0586, keywords: ['ساری', 'مازندران'] },
  { title: 'گرگان', subtitle: 'مرکز استان گلستان', lat: 36.8427, lng: 54.4439, keywords: ['گرگان', 'گلستان'] },
  { title: 'زنجان', subtitle: 'مرکز استان زنجان', lat: 36.6736, lng: 48.4787, keywords: ['زنجان'] },
  { title: 'سنندج', subtitle: 'مرکز استان کردستان', lat: 35.3144, lng: 46.9923, keywords: ['سنندج', 'کردستان'] },
  { title: 'خرم‌آباد', subtitle: 'مرکز استان لرستان', lat: 33.4878, lng: 48.3558, keywords: ['خرم اباد', 'خرم آباد', 'لرستان'] },
  { title: 'بندرعباس', subtitle: 'مرکز استان هرمزگان', lat: 27.1832, lng: 56.2666, keywords: ['بندرعباس', 'هرمزگان'] },
  { title: 'بوشهر', subtitle: 'مرکز استان بوشهر', lat: 28.9220, lng: 50.8331, keywords: ['بوشهر'] },
  { title: 'سمنان', subtitle: 'مرکز استان سمنان', lat: 35.5769, lng: 53.3970, keywords: ['سمنان'] },
  { title: 'زاهدان', subtitle: 'مرکز استان سیستان و بلوچستان', lat: 29.4963, lng: 60.8629, keywords: ['زاهدان', 'سیستان'] },
  { title: 'بجنورد', subtitle: 'مرکز استان خراسان شمالی', lat: 37.4761, lng: 57.3283, keywords: ['بجنورد'] },
  { title: 'بیرجند', subtitle: 'مرکز استان خراسان جنوبی', lat: 32.8663, lng: 59.2211, keywords: ['بیرجند'] },
  { title: 'اردبیل', subtitle: 'مرکز استان اردبیل', lat: 38.2498, lng: 48.2973, keywords: ['اردبیل'] },
  { title: 'ایلام', subtitle: 'مرکز استان ایلام', lat: 33.6374, lng: 46.4227, keywords: ['ایلام'] },
  { title: 'شهرکرد', subtitle: 'مرکز استان چهارمحال و بختیاری', lat: 32.3256, lng: 50.8644, keywords: ['شهرکرد'] },
  { title: 'یاسوج', subtitle: 'مرکز استان کهگیلویه و بویراحمد', lat: 30.6684, lng: 51.5876, keywords: ['یاسوج'] },
];

export default function SearchLocation({
  onSelect,
  coords,
  onOpenChange,
  placeholder = 'جستجوی آدرس (شهر، محله، خیابان...)',
  disabled = false,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const skipNextSearch = useRef(false);
  const coordsRef = useRef(coords);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Close suggestions popover when clicking outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  // Debounced search query
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      if (results.length > 0 || hasSearched || isOpen || activeIndex !== -1) {
        setResults([]);
        setHasSearched(false);
        setSearchError(false);
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    const normalizedQ = normalizePersian(trimmed);

    // 1. Instant local matches (0ms latency)
    const localMatches = IRAN_MAJOR_PLACES.filter((p) => {
      const matchTitle = normalizePersian(p.title).includes(normalizedQ);
      const matchSubtitle = normalizePersian(p.subtitle).includes(normalizedQ);
      const matchKeyword = p.keywords?.some((k) => normalizePersian(k).includes(normalizedQ));
      return matchTitle || matchSubtitle || matchKeyword;
    }).map((p) => ({
      ...p,
      address: `${p.subtitle}، ${p.title}`,
      source: 'local',
    }));

    if (localMatches.length > 0) {
      setResults(localMatches.slice(0, 8));
      setHasSearched(true);
      setIsOpen(true);
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setSearchError(false);

        const currentCoords = coordsRef.current;
        const biasLat = currentCoords?.lat || 35.6892;
        const biasLng = currentCoords?.lng || 51.3890;

        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(normalizedQ)}&lat=${biasLat}&lon=${biasLng}&lang=default&limit=8`;

        const res = await fetch(photonUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error(`Search error status: ${res.status}`);
        }

        const data = await res.json();
        const features = Array.isArray(data.features) ? data.features : [];

        const osmItems = features.map((f) => {
          const props = f.properties || {};
          const geomCoords = f.geometry?.coordinates || [];
          const name = props.name || props.street || '';
          const city = props.city || props.town || props.village || props.county || '';
          const state = props.state || '';
          const district = props.district || props.suburb || props.neighbourhood || '';

          const subtitleParts = [district, city, state].filter(Boolean);
          const subtitle = subtitleParts.join('، ') || (props.country || 'ایران');
          const address = [state, city, district, name].filter(Boolean).join('، ');

          return {
            title: name,
            subtitle,
            address: address || name,
            lat: geomCoords[1],
            lng: geomCoords[0],
            source: 'osm',
          };
        }).filter((item) => item.title && !isNaN(item.lat) && !isNaN(item.lng));

        // Merge & deduplicate local + OSM results
        const combined = [...localMatches];
        for (const o of osmItems) {
          const isDuplicate = combined.some((existing) => {
            const dist = Math.hypot(existing.lat - o.lat, existing.lng - o.lng);
            return dist < 0.003 || normalizePersian(existing.title) === normalizePersian(o.title);
          });
          if (!isDuplicate) {
            combined.push(o);
          }
        }

        const finalResults = combined.slice(0, 10);
        setResults(finalResults);
        setHasSearched(true);
        setIsOpen(true);
        setActiveIndex(-1);
        if (listRef.current) {
          listRef.current.scrollTop = 0;
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        // If local matches already exist, keep them rather than showing an error
        if (localMatches.length === 0) {
          setResults([]);
          setSearchError(true);
          setIsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  const handleSelect = useCallback(
    (item) => {
      const lat = item?.lat ?? item?.location?.y;
      const lng = item?.lng ?? item?.location?.x;

      if (lat == null || lng == null) {
        return;
      }

      onSelect?.({
        lat: Number(lat),
        lng: Number(lng),
        address: item.address || item.title || '',
        title: item.title || '',
      });

      skipNextSearch.current = true;
      setIsOpen(false);
      setActiveIndex(-1);
      setQuery(item.title || item.address || '');
    },
    [onSelect]
  );

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setSearchError(false);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const showResultsList = isOpen && results.length > 0;
  const showEmptyState =
    isOpen &&
    !loading &&
    hasSearched &&
    results.length === 0 &&
    query.trim().length >= 2;

  return (
    <div
      ref={containerRef}
      dir="rtl"
      className="relative w-full text-right"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* SEARCH INPUT BAR */}
      <div
        className="
          flex items-center gap-2.5
          h-10 sm:h-11
          bg-white/95 dark:bg-slate-900/95
          backdrop-blur-md
          border border-slate-200/90 dark:border-slate-700/90
          rounded-2xl
          px-3
          shadow-md shadow-slate-900/5 dark:shadow-black/30
          transition-all
          focus-within:border-sky-500 dark:focus-within:border-sky-400
          focus-within:ring-2 focus-within:ring-sky-200/60 dark:focus-within:ring-sky-500/20
        "
      >
        <Search className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />

        <input
          ref={inputRef}
          type="text"
          dir="rtl"
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 && (results.length > 0 || hasSearched)) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          aria-expanded={showResultsList || showEmptyState}
          aria-autocomplete="list"
          className="
            flex-1 min-w-0
            bg-transparent
            outline-none
            text-xs sm:text-sm
            text-right
            text-slate-800 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
          "
        />

        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline text-[11px] font-medium">در حال جستجو...</span>
          </div>
        )}

        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="پاک کردن جستجو"
            title="پاک کردن"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* SUGGESTIONS POPOVER */}
      {(showResultsList || showEmptyState) && (
        <div
          dir="rtl"
          data-testid="search-suggestions"
          className="
            absolute
            top-full
            inset-x-0
            mt-1.5
            rounded-2xl
            overflow-hidden
            bg-white/98 dark:bg-slate-900/98
            backdrop-blur-xl
            border border-slate-200 dark:border-slate-700
            shadow-xl shadow-slate-900/15 dark:shadow-black/50
            z-[1050]
          "
        >
          {showResultsList && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-sky-50/80 dark:bg-slate-800/80 border-b border-sky-100 dark:border-slate-800 text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  نتایج جستجو
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold border border-sky-100 dark:border-slate-700">
                    {results.length.toLocaleString('fa-IR')} مورد
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="بستن پیشنهادها"
                    className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Suggestions List */}
              <ul
                ref={listRef}
                role="listbox"
                className="
                  flex flex-col
                  overflow-y-auto
                  overscroll-contain
                  max-h-[190px] sm:max-h-[220px]
                  divide-y divide-slate-100 dark:divide-slate-800/60
                "
              >
                {results.map((item, index) => {
                  const secondaryText = item.subtitle || item.address || '';
                  const isActive = activeIndex === index;

                  return (
                    <li
                      key={`${item.title}-${item.lat}-${item.lng}-${index}`}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSelect(item)}
                      className={`
                        group flex items-center gap-2.5 px-3 py-2 cursor-pointer text-right transition-colors
                        ${
                          isActive
                            ? 'bg-sky-50 dark:bg-slate-800/90'
                            : 'hover:bg-sky-50/60 dark:hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <span className="w-7 h-7 rounded-lg bg-sky-100/70 dark:bg-slate-800 border border-sky-200/60 dark:border-slate-700 text-sky-600 dark:text-sky-400 group-hover:bg-sky-200/80 dark:group-hover:bg-sky-900/40 flex items-center justify-center shrink-0 transition-colors">
                        <MapPin className="w-3.5 h-3.5" />
                      </span>

                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {item.title}
                        </div>
                        {secondaryText && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {secondaryText}
                          </div>
                        )}
                      </div>

                      <ChevronLeft className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-transform group-hover:-translate-x-0.5 shrink-0" />
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {showEmptyState && (
            <div className="px-4 py-3 flex items-center gap-3 text-right">
              <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {searchError ? 'خطا در جستجوی آدرس' : 'موردی پیدا نشد'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  {searchError
                    ? 'لطفاً دوباره تلاش کنید یا موقعیت را روی نقشه انتخاب نمایید.'
                    : 'نام شهر، محله یا خیابان دیگری را امتحان فرمایید.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
