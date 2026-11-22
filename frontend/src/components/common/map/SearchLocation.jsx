import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { SearchBar } from './SearchBar';
import { SearchSuggestions } from './SearchSuggestions';
import { LOCAL_PLACES } from './iranPlaces';

const RECENT_SEARCHES_STORAGE_KEY = 'iranswim_qazvin_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const ARABIC_TO_PERSIAN = {
  'ي': 'ی', 'ك': 'ک', 'ة': 'ه', 'ۀ': 'ه', 'ؤ': 'و',
  'إ': 'ا', 'أ': 'ا', 'آ': 'ا', 'ئ': 'ی',
};

const FA_DIGITS_MAP = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

const NUMBER_WORDS = {
  'یک': 1, 'اول': 1, 'یکم': 1, 'دو': 2, 'دوم': 2, 'سه': 3, 'سوم': 3,
  'چهار': 4, 'چهارم': 4, 'پنج': 5, 'پنجم': 5, 'شش': 6, 'ششم': 6,
  'هفت': 7, 'هفتم': 7, 'هشت': 8, 'هشتم': 8, 'نه': 9, 'نهم': 9,
  'ده': 10, 'دهم': 10, 'یازده': 11, 'دوازده': 12, 'سیزده': 13,
  'چهارده': 14, 'پانزده': 15, 'شانزده': 16, 'هفده': 17, 'هجده': 18,
  'نوزده': 19, 'بیست': 20, 'سی': 30, 'چهل': 40, 'پنجاه': 50,
  'شصت': 60, 'هفتاد': 70, 'هشتاد': 80, 'نود': 90,
};

function normalizeClient(text) {
  if (!text) return '';
  let s = String(text);
  for (const [ar, fa] of Object.entries(ARABIC_TO_PERSIAN)) s = s.replaceAll(ar, fa);
  for (const [ar, en] of Object.entries(FA_DIGITS_MAP)) s = s.replaceAll(ar, en);
  s = s.replace(/[\u064B-\u065F\u0670]/g, '').replace(/\u200c/g, ' ');
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

function convertWordsClient(text) {
  const norm = normalizeClient(text);
  const tokens = norm.split(' ');
  for (let i = 0; i < tokens.length; i++) {
    if (i + 2 < tokens.length && tokens[i + 1] === 'و') {
      const t = NUMBER_WORDS[tokens[i]];
      const o = NUMBER_WORDS[tokens[i + 2]];
      if (t !== undefined && o !== undefined) {
        tokens.splice(i, 3, String(t + o));
        continue;
      }
    }
    const single = NUMBER_WORDS[tokens[i]];
    if (single !== undefined) tokens[i] = String(single);
  }
  return tokens.join(' ');
}

export default function SearchLocation({
  onSelect,
  coords,
  onOpenChange,
  placeholder = 'جستجوی آدرس (محله، کوچه...)',
  disabled = false,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState({});
  const [outsideScopeInfo, setOutsideScopeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);

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

  // Load Recent Searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveRecentSearch = useCallback((item) => {
    if (!item || !item.title) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((p) => p.title !== item.title);
      const updated = [
        {
          id: item.id || `recent_${Date.now()}`,
          title: item.title,
          subtitle: item.subtitle || item.address || '',
          category: item.category,
          category_label: item.category_label,
          latitude: item.latitude || item.lat,
          longitude: item.longitude || item.lng,
          icon: item.icon,
        },
        ...filtered,
      ].slice(0, MAX_RECENT_SEARCHES);

      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage write errors
      }
      return updated;
    });
  }, []);

  const handleClearRecent = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const handleRemoveRecentItem = useCallback((item) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((p) => p.title !== item.title);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  // Close dropdown when clicking outside
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

const GENERIC_ROAD_WORDS = new Set([
  'کوچه', 'کوچهی', 'کوچهٔ', 'خیابان', 'بلوار', 'میدان', 'چهارراه',
  'بزرگراه', 'شهرک', 'محله', 'بن‌بست', 'بن', 'بست', 'فرعی', 'معبر',
  'راسته', 'گذر', 'فلکه', 'تقاطع'
]);

function extractNumberClient(text) {
  if (!text) return null;
  const withDigits = convertWordsClient(text);
  const match = withDigits.match(/\b(\d+)\b/);
  return match ? parseInt(match[1], 10) : null;
}

  // Offline / Fallback Local Search strictly using verified Qazvin places
  const searchLocalFallback = useCallback((q) => {
    if (!q || !LOCAL_PLACES) return [];
    const normQ = normalizeClient(q);
    const withDigits = convertWordsClient(normQ);
    const queryNumber = extractNumberClient(normQ);

    const rawTokens = Array.from(new Set([
      ...normQ.split(' ').filter((t) => t.length > 0 && t !== 'و'),
      ...withDigits.split(' ').filter((t) => t.length > 0 && t !== 'و'),
    ]));

    if (rawTokens.length === 0) return [];

    // Distinct content tokens (non-generic road types, non-numeric)
    const contentTokens = rawTokens.filter(
      (t) => !GENERIC_ROAD_WORDS.has(t) && !/^\d+$/.test(t)
    );

    const scored = [];
    for (const p of LOCAL_PLACES) {
      const full = normalizeClient(
        `${p.title || ''} ${p.address || ''} ${p.neighborhood || ''} ${p.street || ''} ${p.alley || ''} ${(p.keywords || []).join(' ')}`
      );
      const fullDigits = convertWordsClient(full);

      // Check number conflict if query has an explicit number
      const placeNumber =
        p.alleyNumber !== undefined
          ? p.alleyNumber
          : extractNumberClient(p.alley) || extractNumberClient(p.title);

      if (queryNumber !== null) {
        if (placeNumber !== null) {
          if (placeNumber !== queryNumber) {
            continue; // Hard conflict: user asked for alley 38, candidate is 1 or 2
          }
        } else {
          // Candidate place has no number. Only match if candidate matched content token
          const hasContentMatch = contentTokens.some((t) => full.includes(t) || fullDigits.includes(t));
          if (!hasContentMatch) continue;
        }
      }

      // Check content tokens: if query has specific content words (e.g. "بهار" in "کوچه بهار"),
      // candidate MUST match at least one content token. Never match purely on "کوچه"!
      let matchedContentCount = 0;
      if (contentTokens.length > 0) {
        for (const t of contentTokens) {
          if (full.includes(t) || fullDigits.includes(t)) {
            matchedContentCount++;
          }
        }
        if (matchedContentCount === 0) {
          continue; // Skipped false positive
        }
      }

      let matchCount = 0;
      for (const t of rawTokens) {
        if (full.includes(t) || fullDigits.includes(t)) {
          matchCount++;
        }
      }

      if (matchCount > 0 || (queryNumber !== null && placeNumber === queryNumber)) {
        let score = (matchCount / rawTokens.length) * 100;
        if (matchCount === rawTokens.length) score += 200;
        if (full.includes(normQ) || fullDigits.includes(withDigits)) score += 300;
        if (queryNumber !== null && placeNumber === queryNumber) score += 800;

        let title = (p.title || '')
          .replace(/(استان\s+)?(شهر\s+)?(شهرستان\s+)?قزوین\s*([،,]\s*)?/g, '')
          .replace(/([،,]\s*)?(استان\s+)?(شهر\s+)?(شهرستان\s+)?قزوین/g, '')
          .replace(/\s*\([^)]*\)/g, '')
          .trim();
        if (p.neighborhood && p.alley && !title.includes(p.neighborhood)) {
          title = `${p.neighborhood}، ${p.alley}`;
        }

        const subtitle = (p.address || '')
          .replace(/(استان\s+)?(شهر\s+)?(شهرستان\s+)?قزوین\s*([،,]\s*)?/g, '')
          .replace(/([،,]\s*)?(استان\s+)?(شهر\s+)?(شهرستان\s+)?قزوین/g, '')
          .replace(/^[،,\s]+|[،,\s]+$/g, '')
          .trim();

        scored.push({
          score,
          alleyNumber: placeNumber,
          id: `local_${p.lat}_${p.lng}`,
          title: title || p.title,
          subtitle,
          category: p.category || 'alley',
          category_label: p.category === 'pool' ? 'استخر و اماکن ورزشی' : p.category === 'alley' ? 'کوچه و معابر فرعی' : 'اماکن قزوین',
          neighborhood: p.neighborhood,
          latitude: p.lat,
          longitude: p.lng,
          icon: p.category === 'pool' ? 'Waves' : p.category === 'alley' ? 'MapPin' : 'Compass',
          type: p.type,
        });
      }
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (queryNumber === null && a.alleyNumber && b.alleyNumber) {
        return a.alleyNumber - b.alleyNumber;
      }
      return 0;
    });

    return scored.slice(0, 10);
  }, []);

  // Main Debounced Autocomplete Effect
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setCategories({});
      setOutsideScopeInfo(null);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const currentCoords = coordsRef.current;
        const params = {
          q: trimmed,
          limit: 10,
        };
        if (currentCoords?.lat && currentCoords?.lng) {
          params.lat = currentCoords.lat;
          params.lng = currentCoords.lng;
        }

        // Call dedicated backend autocomplete endpoint
        const response = await axios.get('/api/locations/autocomplete/', {
          params,
          signal: controller.signal,
        });

        const data = response.data || {};

        if (data.is_outside_scope) {
          setOutsideScopeInfo({
            is_outside_scope: true,
            detected_location: data.detected_location,
            message: data.message,
          });
          setSuggestions([]);
          setCategories({});
        } else {
          setOutsideScopeInfo(null);
          setSuggestions(data.suggestions || []);
          setCategories(data.categories || {});
        }

        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;

        // Fallback to local verified Qazvin places
        const localMatches = searchLocalFallback(trimmed);
        setOutsideScopeInfo(null);
        setSuggestions(localMatches);
        setCategories({ places: localMatches });
        setIsOpen(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 280);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query, searchLocalFallback]);

  const handleSelect = useCallback(
    (item) => {
      const lat = item?.latitude ?? item?.lat;
      const lng = item?.longitude ?? item?.lng;

      if (lat == null || lng == null) {
        return;
      }

      const formattedHierarchy = item.subtitle || item.address || item.title || '';

      saveRecentSearch(item);

      onSelect?.({
        lat: Number(lat),
        lng: Number(lng),
        address: formattedHierarchy,
        title: item.title || formattedHierarchy,
      });

      skipNextSearch.current = true;
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onSelect, saveRecentSearch]
  );

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setCategories({});
    setOutsideScopeInfo(null);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelectTag = (tag) => {
    setQuery(tag);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    const totalItems = suggestions.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

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
      {/* 1. SEARCH INPUT BAR */}
      <SearchBar
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={handleClear}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        loading={loading}
        isOpen={isOpen}
        disabled={disabled}
      />

      {/* 2. SEARCH SUGGESTIONS DROPDOWN PANEL */}
      {isOpen && (
        <div
          className="
            absolute top-full mt-2 inset-x-0
            bg-white/98 dark:bg-slate-900/98
            backdrop-blur-xl
            border border-sky-100 dark:border-slate-800
            rounded-2xl
            shadow-2xl shadow-slate-900/15 dark:shadow-black/60
            z-[1050]
            overflow-hidden
            animate-in fade-in slide-in-from-top-1 duration-150
          "
        >
          <SearchSuggestions
            query={query}
            suggestions={suggestions}
            categories={categories}
            recentSearches={recentSearches}
            outsideScopeInfo={outsideScopeInfo}
            loading={loading}
            activeIndex={activeIndex}
            onSelect={handleSelect}
            onSelectTag={handleSelectTag}
            onClearRecent={handleClearRecent}
            onRemoveRecent={handleRemoveRecentItem}
            listRef={listRef}
          />
        </div>
      )}
    </div>
  );
}
