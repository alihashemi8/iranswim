import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, MapPin, X, Loader2, ChevronLeft, Building2 } from 'lucide-react';
import { LOCAL_PLACES } from './iranPlaces';

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

function tokenize(text) {
  const norm = normalizePersian(text);
  return norm.split(' ').filter((t) => t.length > 0);
}

// Synonyms and stem expansions for common Iranian search patterns (like Neshan / Snapp)
const STEM_EXPANSIONS = {
  'نوروزی': ['نوروزیان', 'نوروز'],
  'نوروز': ['نوروزیان', 'نوروزی'],
  'ولیعصر': ['ولی عصر', 'عصر'],
  'شریعتی': ['دکتر شریعتی', 'کوروش'],
  'مطهری': ['شهید مطهری', 'تخت طاووس'],
  'بهشتی': ['شهید بهشتی', 'عباس آباد'],
  'سعادت اباد': ['سعادت آباد', 'کاج'],
  'صادقیه': ['آریاشهر', 'اریاشهر'],
  'گوهردشت': ['رجایی شهر', 'رجایی‌شهر'],
  'تهرانپارس': ['تهران پارس'],
  'هفت تیر': ['شهدای هفتم تیر', '۲۵ شهریور'],
  'پاسداران': ['سلطنت آباد', 'سلطنت اباد'],
  'انقلاب': ['میدان انقلاب', 'انقلاب اسلامی'],
  'ازادی': ['آزادی', 'میدان آزادی'],
};

export default function SearchLocation({
  onSelect,
  coords,
  onOpenChange,
  placeholder = 'جستجوی آدرس (استان، شهر، محله، خیابان...)',
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

  // Pre-indexed local database for sub-1ms search
  const indexedPlaces = useMemo(() => {
    return (LOCAL_PLACES || []).map((p) => ({
      ...p,
      _norm_title: normalizePersian(p.title),
      _norm_city: normalizePersian(p.city || ''),
      _norm_county: normalizePersian(p.county || ''),
      _norm_state: normalizePersian(p.state || ''),
      _norm_keywords: (p.keywords || []).map(normalizePersian),
    }));
  }, []);

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

  // Multi-token scoring algorithm (based on afshar geo_search engine)
  const scorePlace = useCallback(
    (place, queryTokens, rawQueryNorm, biasCoords) => {
      if (!queryTokens.length) return 0;
      const normTitle = place._norm_title;
      const titleWords = normTitle.split(' ');
      let score = 0;
      let matchedCount = 0;

      for (const qToken of queryTokens) {
        let matched = false;
        let bestTokenScore = 0;

        // Check each word in title
        for (const tw of titleWords) {
          if (tw === qToken) {
            bestTokenScore = Math.max(bestTokenScore, 60.0);
            matched = true;
          } else if (tw.startsWith(qToken)) {
            // Prefix match (e.g., 'نوروزی' matches 'نوروزیان')
            const ratio = qToken.length / tw.length;
            bestTokenScore = Math.max(bestTokenScore, 42.0 + ratio * 15.0);
            matched = true;
          } else if (qToken.startsWith(tw) && tw.length >= 3) {
            bestTokenScore = Math.max(bestTokenScore, 35.0);
            matched = true;
          }
        }

        // Check city / county match
        if (place._norm_city === qToken || place._norm_county === qToken) {
          bestTokenScore = Math.max(bestTokenScore, 45.0);
          matched = true;
        } else if (place._norm_city.startsWith(qToken) || place._norm_county.startsWith(qToken)) {
          bestTokenScore = Math.max(bestTokenScore, 35.0);
          matched = true;
        }

        // Check keywords and synonyms
        if (!matched) {
          for (const kw of place._norm_keywords) {
            if (kw === qToken) {
              bestTokenScore = Math.max(bestTokenScore, 38.0);
              matched = true;
              break;
            } else if (kw.startsWith(qToken)) {
              bestTokenScore = Math.max(bestTokenScore, 28.0);
              matched = true;
              break;
            } else if (kw.includes(qToken)) {
              bestTokenScore = Math.max(bestTokenScore, 18.0);
              matched = true;
              break;
            }
          }
        }

        // Check stem expansions (e.g. 'نوروزی' -> 'نوروزیان')
        if (!matched && STEM_EXPANSIONS[qToken]) {
          for (const exp of STEM_EXPANSIONS[qToken]) {
            const expNorm = normalizePersian(exp);
            if (normTitle.includes(expNorm)) {
              bestTokenScore = Math.max(bestTokenScore, 40.0);
              matched = true;
              break;
            }
            for (const kw of place._norm_keywords) {
              if (kw.includes(expNorm)) {
                bestTokenScore = Math.max(bestTokenScore, 30.0);
                matched = true;
                break;
              }
            }
          }
        }

        if (matched) {
          matchedCount++;
          score += bestTokenScore;
        } else {
          score -= 22.0;
        }
      }

      if (matchedCount === 0) return 0;

      // Penalize missing tokens in multi-word queries
      if (matchedCount < queryTokens.length) {
        score *= (matchedCount / queryTokens.length) * 0.35;
      } else {
        score += 45.0; // Full coverage bonus
      }

      // Exact match bonus
      if (normTitle === rawQueryNorm) {
        score += 55.0;
      } else if (normTitle.includes(rawQueryNorm)) {
        score += 30.0;
      }

      // Base weight bonus
      score += (place.weight || 50) * 0.1;

      // Distance proximity bonus/penalty if coords are provided
      if (biasCoords && typeof biasCoords.lat === 'number' && typeof biasCoords.lng === 'number') {
        const distKm = Math.hypot((place.lat - biasCoords.lat) * 111.0, (place.lng - biasCoords.lng) * 88.0);
        if (distKm < 25) {
          score += 20.0; // Nearby bonus
        } else {
          score -= Math.min(distKm * 0.25, 25.0);
        }
      }

      return score;
    },
    []
  );

  // Fast local search engine
  const searchLocal = useCallback(
    (q, limit = 8) => {
      const normQ = normalizePersian(q);
      const tokens = tokenize(q);
      if (!tokens.length) return [];

      const currentCoords = coordsRef.current;
      const scored = [];

      for (const p of indexedPlaces) {
        const s = scorePlace(p, tokens, normQ, currentCoords);
        if (s > 25.0) {
          scored.push({
            score: s,
            title: p.title,
            subtitle: p.subtitle || (p.city ? `${p.city}، ${p.state || ''}` : p.address),
            address: p.address || p.title,
            lat: p.lat,
            lng: p.lng,
            type: p.type || 'place',
            source: 'local',
          });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, limit);
    },
    [indexedPlaces, scorePlace]
  );

  const resetSearch = useCallback(() => {
    setResults([]);
    setHasSearched(false);
    setSearchError(false);
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      resetSearch();
      return;
    }

    const normalizedQ = normalizePersian(trimmed);
    const tokens = tokenize(trimmed);

    // 1. Instant local matches (0ms response time!)
    const localMatches = searchLocal(trimmed, 8);
    if (localMatches.length > 0) {
      setResults(localMatches);
      setHasSearched(true);
      setIsOpen(true);
      setActiveIndex(-1);
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setSearchError(false);

        const currentCoords = coordsRef.current;
        const biasLat = currentCoords?.lat || 35.6892;
        const biasLng = currentCoords?.lng || 51.3890;

        // Generate smart search variants for remote geocoder
        const variants = [normalizedQ];

        // If query contains stems like 'نوروزی', also search 'نوروزیان'
        for (const t of tokens) {
          if (STEM_EXPANSIONS[t]) {
            for (const exp of STEM_EXPANSIONS[t]) {
              variants.push(normalizedQ.replace(t, exp));
            }
          }
        }

        // If tokens > 1, try inverted variant
        if (tokens.length >= 2) {
          variants.push(tokens.slice().reverse().join(' '));
        }

        const uniqueVariants = Array.from(new Set(variants)).slice(0, 2);

        // Fetch Photon with proximity bias
        const photonPromises = uniqueVariants.map((v) => {
          const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(v)}&lat=${biasLat}&lon=${biasLng}&lang=default&limit=6`;
          return fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }).then((r) => (r.ok ? r.json() : { features: [] })).catch(() => ({ features: [] }));
        });

        const responses = await Promise.all(photonPromises);
        const allFeatures = [];
        for (const data of responses) {
          if (Array.isArray(data.features)) {
            allFeatures.push(...data.features);
          }
        }

        // Format remote items into clean Snapp/Neshan style
        const osmItems = allFeatures
          .map((f) => {
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
              type: props.osm_value || props.type || 'place',
              source: 'osm',
            };
          })
          .filter((item) => item.title && !isNaN(item.lat) && !isNaN(item.lng));

        // Merge local matches and OSM results, deduplicating by coordinates and title
        const combined = [...localMatches];
        for (const o of osmItems) {
          const isDuplicate = combined.some((existing) => {
            const dist = Math.hypot(existing.lat - o.lat, existing.lng - o.lng);
            return (
              dist < 0.003 ||
              normalizePersian(existing.title) === normalizePersian(o.title)
            );
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
  }, [query, searchLocal, resetSearch]);

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
          h-11 sm:h-12
          bg-white/98 dark:bg-slate-900/98
          backdrop-blur-md
          border border-sky-200/90 dark:border-slate-700/90
          rounded-2xl
          px-3.5
          shadow-lg shadow-slate-900/10 dark:shadow-black/40
          transition-all
          focus-within:border-sky-500 dark:focus-within:border-sky-400
          focus-within:ring-2 focus-within:ring-sky-200/60 dark:focus-within:ring-sky-500/25
        "
      >
        <Search className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400 shrink-0" />

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
            <Loader2 className="w-4 h-4 animate-spin" />
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
            <X className="w-4 h-4" />
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
            border border-sky-200/90 dark:border-slate-700
            shadow-2xl shadow-slate-900/20 dark:shadow-black/60
            z-[1050]
          "
        >
          {showResultsList && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-sky-50/90 dark:bg-slate-800/90 border-b border-sky-100 dark:border-slate-800 text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  نتایج جستجو (نشان / اسنپ)
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold border border-sky-100 dark:border-slate-700 shadow-2xs">
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
                  max-h-[210px] sm:max-h-[240px]
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
                        group flex items-center gap-3 px-3.5 py-2.5 cursor-pointer text-right transition-colors
                        ${
                          isActive
                            ? 'bg-sky-50/90 dark:bg-slate-800/90'
                            : 'hover:bg-sky-50/60 dark:hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <span className="w-8 h-8 rounded-xl bg-sky-100/70 dark:bg-slate-800 border border-sky-200/60 dark:border-slate-700 text-sky-600 dark:text-sky-400 group-hover:bg-sky-200/80 dark:group-hover:bg-sky-900/40 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                        {item.type === 'university' || item.type === 'hospital' || item.type === 'office' ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </span>

                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {item.title}
                        </div>
                        {secondaryText && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {secondaryText}
                          </div>
                        )}
                      </div>

                      <ChevronLeft className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-transform group-hover:-translate-x-0.5 shrink-0" />
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {showEmptyState && (
            <div className="px-4 py-3.5 flex items-center gap-3 text-right">
              <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {searchError ? 'خطا در جستجوی آدرس' : 'موردی پیدا نشد'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  {searchError
                    ? 'لطفاً دوباره تلاش کنید یا موقعیت را روی نقشه انتخاب فرمایید.'
                    : 'نام شهر، خیابان، محله یا میدان دیگری را جستجو فرمایید.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
