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
  str = str.replace(/[,،\-_.\\()[\]+!؟?«»"':#@/]+/g, ' ');
  return str.replace(/\s+/g, ' ').trim().toLowerCase();
}

function tokenize(text) {
  const norm = normalizePersian(text);
  return norm.split(' ').filter((t) => t.length > 0);
}

// Persian written number words to digits parser (حروف به عدد)
const PERSIAN_NUMBER_MAP = {
  'یک': 1, 'اول': 1, 'یکم': 1,
  'دو': 2, 'دوم': 2,
  'سه': 3, 'سوم': 3,
  'چهار': 4, 'چهارم': 4,
  'پنج': 5, 'پنجم': 5,
  'شش': 6, 'ششم': 6,
  'هفت': 7, 'هفتم': 7,
  'هشت': 8, 'هشتم': 8,
  'نه': 9, 'نهم': 9,
  'ده': 10, 'دهم': 10,
  'یازده': 11, 'یازدهم': 11,
  'دوازده': 12, 'دوازدهم': 12,
  'سیزده': 13, 'سیزدهم': 13,
  'چهارده': 14, 'چهاردهم': 14,
  'پانزده': 15, 'پانزدهم': 15,
  'شانزده': 16, 'شانزدهم': 16,
  'هفده': 17, 'هفدهم': 17,
  'هجده': 18, 'هجدهم': 18,
  'نوزده': 19, 'نوزدهم': 19,
  'بیست': 20, 'بیستم': 20,
  'سی': 30, 'سی‌ام': 30, 'سی ام': 30,
  'چهل': 40, 'چهلم': 40,
  'پنجاه': 50, 'پنجاهم': 50,
  'شصت': 60, 'شصتم': 60,
  'هفتاد': 70, 'هفتادم': 70,
  'هشتاد': 80, 'هشتادم': 80,
  'نود': 90, 'نودم': 90,
};

function parsePersianWordNumber(str) {
  if (!str) return null;
  const s = str.trim();
  if (PERSIAN_NUMBER_MAP[s] !== undefined) return PERSIAN_NUMBER_MAP[s];

  const parts = s.split(/\s*و\s*/);
  if (parts.length === 2) {
    const t = PERSIAN_NUMBER_MAP[parts[0]];
    const o = PERSIAN_NUMBER_MAP[parts[1]];
    if (t !== undefined && o !== undefined) return t + o;
  }

  // Token scan: check if string contains single number or compound number anywhere
  const tokens = s.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    if (i + 2 < tokens.length && tokens[i + 1] === 'و') {
      const t = PERSIAN_NUMBER_MAP[tokens[i]];
      const o = PERSIAN_NUMBER_MAP[tokens[i + 2]];
      if (t !== undefined && o !== undefined) return t + o;
    }
    if (PERSIAN_NUMBER_MAP[tokens[i]] !== undefined) {
      return PERSIAN_NUMBER_MAP[tokens[i]];
    }
    if (/^[0-9]+$/.test(tokens[i])) {
      return parseInt(tokens[i], 10);
    }
  }

  if (/^[0-9]+$/.test(s)) return parseInt(s, 10);
  return null;
}

// Convert compound or single Persian number words in query to digits
function convertQueryWordsToDigits(query) {
  if (!query) return '';
  const tokens = query.trim().split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    if (i + 2 < tokens.length && tokens[i + 1] === 'و') {
      const candidate = `${tokens[i]} و ${tokens[i + 2]}`;
      const num = parsePersianWordNumber(candidate);
      if (num !== null) {
        tokens.splice(i, 3, String(num));
        i--;
        continue;
      }
    }
    const singleNum = parsePersianWordNumber(tokens[i]);
    if (singleNum !== null && singleNum > 0) {
      tokens[i] = String(singleNum);
    }
  }
  return tokens.join(' ');
}

const STEM_EXPANSIONS = {
  'نوروزی': ['نوروزیان', 'نوروز'],
  'نوروز': ['نوروزیان', 'نوروزی'],
  'ولیعصر': ['ولی عصر', 'عصر'],
  'شریعتی': ['دکتر شریعتی', 'کوروش'],
  'مطهری': ['شهید مطهری'],
  'بهشتی': ['شهید بهشتی'],
  'بابایی': ['شهید بابایی'],
  'رجایی': ['شهید رجایی'],
  'غیاث اباد': ['غیاث‌آباد', 'غیاث آباد'],
};

const KNOWN_NEIGHBORHOODS = [
  'نوروزیان', 'خیام', 'پونک', 'ملاصدرا', 'غیاث‌آباد', 'غیاث آباد',
  'فلسطین', 'دانشگاه', 'شهرک کوثر', 'شهرک مینودر', 'کوثر', 'مینودر',
  'دهخدا', 'فردوسی', 'نادری', 'بوعلی', 'سعدی', 'طالقانی', 'سپه',
  'مولوی', 'راه ری', 'راه‌آهن', 'راه آهن', 'میرعماد', 'سرداران',
  'مدرس', 'باغ دبیر', 'باراجین', 'پادگان', 'جانبازان', 'ولیعصر',
  'شهید بهشتی', 'چهلستون', 'سبزه‌میدان', 'سبزه میدان', 'عارف',
  'سرتک', 'هادی‌آباد', 'هادی آباد', 'مهرگان', 'زیباشهر', 'تبریز قدیم',
  'تهران قدیم', 'نواب صفوی', 'کوروش'
];

const DIGITS_FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function toPersianDigits(str) {
  return String(str).replace(/[0-9]/g, (d) => DIGITS_FA[d]);
}

/**
 * Builds the exact hierarchy required by user:
 * شهر، محله، خیابان/بلوار، کوچه
 */
function buildHierarchyString(item) {
  let city = item.city || 'قزوین';
  city = city.replace(/^شهر\s+/, '').replace(/^شهرستان\s+/, '').trim();
  if (!city || city === 'استان قزوین') city = 'قزوین';

  let neighborhood = item.neighborhood || '';
  let street = item.street || '';
  let alley = item.alley || '';

  const rawTitle = (item.title || item.name || '').trim();
  const rawLocality = (item.locality || '').trim();
  const rawDistrict = (item.district || '').trim();
  const rawAddress = (item.address || '').trim();

  // 1. Resolve neighborhood
  if (!neighborhood) {
    if (rawLocality && !rawLocality.startsWith('منطقه')) {
      if (rawLocality.includes('خیام')) neighborhood = 'خیام';
      else if (rawLocality.includes('نوروزی')) neighborhood = 'نوروزیان';
      else if (rawLocality.includes('پونک')) neighborhood = 'پونک';
      else if (rawLocality.includes('غیاث')) neighborhood = 'غیاث‌آباد';
      else if (rawLocality.includes('کوثر')) neighborhood = 'شهرک کوثر';
      else if (rawLocality.includes('مینودر')) neighborhood = 'شهرک مینودر';
      else neighborhood = rawLocality;
    } else {
      const full = `${rawTitle} ${rawLocality} ${rawAddress} ${rawDistrict}`;
      for (const kn of KNOWN_NEIGHBORHOODS) {
        if (full.includes(kn)) {
          neighborhood = kn;
          break;
        }
      }
    }
  }

  // 2. Resolve street and alley
  const isAlleyTitle = /^(کوچه|بن\s*بست|بن‌بست|فرعی|حکمت|دانش|اندیشه|سحر|مصلی|گلستان|یاس|شقایق|نیلوفر|بنفشه|لاله|نسترن|ارغوان|بهار|مهرداد|پروین|طاووس|سعادت|توحید|کاوه|یاسمن|شبنم|صبا|مرصاد)/.test(rawTitle);
  const isStreetTitle = /^(بلوار|خیابان|میدان|چهارراه|پل|فلکه|بزرگراه|طریق)/.test(rawTitle);

  if (isAlleyTitle) {
    if (!alley) alley = rawTitle.startsWith('کوچه') || rawTitle.startsWith('بن') ? rawTitle : `کوچه ${rawTitle}`;
  } else if (isStreetTitle) {
    if (!street) street = rawTitle;
  } else if (item.osm_value === 'residential' || item.osm_value === 'service' || item.osm_value === 'living_street') {
    if (!alley) {
      alley = rawTitle.startsWith('کوچه') || rawTitle.startsWith('بن') ? rawTitle : `کوچه ${rawTitle}`;
    }
  } else if (item.type === 'street' || item.osm_value === 'tertiary') {
    if (!street) {
      street = rawTitle.startsWith('خیابان') || rawTitle.startsWith('بلوار') ? rawTitle : `خیابان ${rawTitle}`;
    }
  } else {
    if (!alley && rawTitle && rawTitle !== neighborhood && rawTitle !== city) {
      alley = rawTitle;
    }
  }

  // Ensure street has proper prefix if bare
  if (street && !/^(خیابان|بلوار|میدان|چهارراه|پل|فلکه|بزرگراه)/.test(street)) {
    street = `خیابان ${street}`;
  }

  // Default main street for well-known Qazvin neighborhoods if not specified
  if (!street && neighborhood) {
    if (neighborhood === 'نوروزیان') street = 'بلوار نوروزیان';
    else if (neighborhood === 'پونک') street = 'بلوار امیرکبیر';
    else if (neighborhood === 'ملاصدرا') street = 'بلوار ملاصدرا';
    else if (neighborhood === 'خیام') street = 'خیابان خیام شمالی';
    else if (neighborhood.includes('غیاث')) street = 'بلوار ارتباطات';
    else if (neighborhood === 'فلسطین') street = 'خیابان فلسطین';
    else if (neighborhood.includes('کوثر')) street = 'بلوار مطهری';
    else if (neighborhood.includes('مینودر')) street = 'بلوار سیدالشهدا';
    else if (neighborhood === 'دهخدا') street = 'بلوار دهخدا';
    else if (neighborhood === 'دانشگاه') street = 'بلوار دانشگاه';
    else if (neighborhood === 'باغ دبیر') street = 'خیابان باغ دبیر';
    else if (neighborhood === 'نواب صفوی') street = 'بلوار نواب صفوی';
    else if (neighborhood === 'مولوی') street = 'خیابان مولوی';
  }

  if (!neighborhood && street) {
    for (const kn of KNOWN_NEIGHBORHOODS) {
      if (street.includes(kn)) {
        neighborhood = kn;
        break;
      }
    }
  }

  // Assemble hierarchy: شهر، محله، خیابان/بلوار، کوچه
  const parts = [city];

  if (neighborhood && neighborhood !== city && !parts.includes(neighborhood)) {
    parts.push(neighborhood);
  }

  if (street && street !== city && street !== neighborhood && !parts.includes(street)) {
    parts.push(street);
  }

  if (alley && alley !== street && alley !== neighborhood && !parts.includes(alley)) {
    parts.push(alley);
  }

  if (parts.length === 1 && rawTitle && rawTitle !== city) {
    parts.push(rawTitle);
  }

  return parts.join('، ');
}

export default function SearchLocation({
  onSelect,
  coords,
  onOpenChange,
  placeholder = 'جستجوی آدرس در قزوین (شهر، محله، خیابان، کوچه...)',
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
      _norm_neighborhood: normalizePersian(p.neighborhood || ''),
      _norm_street: normalizePersian(p.street || ''),
      _norm_alley: normalizePersian(p.alley || ''),
      _hierarchy: buildHierarchyString(p),
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

  // Multi-token scoring algorithm tailored for Qazvin
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
            bestTokenScore = Math.max(bestTokenScore, 65.0);
            matched = true;
          } else if (tw.startsWith(qToken)) {
            const ratio = qToken.length / tw.length;
            bestTokenScore = Math.max(bestTokenScore, 45.0 + ratio * 15.0);
            matched = true;
          } else if (qToken.startsWith(tw) && tw.length >= 3) {
            bestTokenScore = Math.max(bestTokenScore, 38.0);
            matched = true;
          }
        }

        // Check neighborhood, street, and alley
        if (
          place._norm_alley.includes(qToken) ||
          place._norm_neighborhood.includes(qToken) ||
          place._norm_street.includes(qToken)
        ) {
          bestTokenScore = Math.max(bestTokenScore, 60.0);
          matched = true;
        }

        // Check city match
        if (place._norm_city === qToken || place._norm_county === qToken) {
          bestTokenScore = Math.max(bestTokenScore, 45.0);
          matched = true;
        }

        // Check keywords
        if (!matched) {
          for (const kw of place._norm_keywords) {
            if (kw === qToken) {
              bestTokenScore = Math.max(bestTokenScore, 50.0);
              matched = true;
              break;
            } else if (kw.startsWith(qToken)) {
              bestTokenScore = Math.max(bestTokenScore, 35.0);
              matched = true;
              break;
            } else if (kw.includes(qToken)) {
              bestTokenScore = Math.max(bestTokenScore, 25.0);
              matched = true;
              break;
            }
          }
        }

        // Stem expansions (e.g. 'نوروزی' -> 'نوروزیان')
        if (!matched && STEM_EXPANSIONS[qToken]) {
          for (const exp of STEM_EXPANSIONS[qToken]) {
            const expNorm = normalizePersian(exp);
            if (
              normTitle.includes(expNorm) ||
              place._norm_neighborhood.includes(expNorm) ||
              place._norm_street.includes(expNorm)
            ) {
              bestTokenScore = Math.max(bestTokenScore, 50.0);
              matched = true;
              break;
            }
          }
        }

        if (matched) {
          matchedCount++;
          score += bestTokenScore;
        } else {
          score -= 15.0;
        }
      }

      if (matchedCount === 0) return 0;

      // Bonus for Qazvin places
      if (place._norm_city.includes('قزوین') || place.state === 'قزوین' || !place.city) {
        score += 80.0;
      }

      // Exact match bonus
      if (normTitle === rawQueryNorm || place._norm_neighborhood === rawQueryNorm || place._norm_alley === rawQueryNorm) {
        score += 65.0;
      } else if (normTitle.includes(rawQueryNorm)) {
        score += 35.0;
      }

      // Proximity bias (defaulting to Qazvin center 36.2797, 50.0049)
      const centerLat = biasCoords?.lat || 36.2797;
      const centerLng = biasCoords?.lng || 50.0049;
      const distKm = Math.hypot((place.lat - centerLat) * 111.0, (place.lng - centerLng) * 88.0);
      if (distKm < 20) {
        score += 30.0;
      } else {
        score -= Math.min(distKm * 0.5, 40.0);
      }

      return score;
    },
    []
  );

  // Instant local search engine
  const searchLocal = useCallback(
    (q, limit = 8) => {
      const normQ = normalizePersian(q);
      const withDigits = convertQueryWordsToDigits(q);
      const strippedAlley = q.replace(/^(کوچه|کوچه‌ی|بن\s*بست|بن‌بست|خیابان|بلوار)\s+/, '').trim();
      const normStripped = normalizePersian(strippedAlley);

      const tokens = Array.from(new Set([
        ...tokenize(q),
        ...tokenize(withDigits),
        ...tokenize(strippedAlley),
      ]));

      if (!tokens.length) return [];

      const queryNum = parsePersianWordNumber(q) || parsePersianWordNumber(withDigits);
      const currentCoords = coordsRef.current;
      const scored = [];

      for (const p of indexedPlaces) {
        // If query specifically asks for a numbered alley (e.g. 40 in حکمت چهل),
        // skip generic unnumbered places or places with a conflicting number
        const placeNum = parsePersianWordNumber(p._norm_title) || parsePersianWordNumber(p._norm_alley);
        if (queryNum !== null && placeNum !== queryNum) {
          continue;
        }

        const s1 = scorePlace(p, tokens, normQ, currentCoords);
        const s2 = normStripped ? scorePlace(p, tokenize(strippedAlley), normStripped, currentCoords) : 0;
        const s = Math.max(s1, s2);

        if (s > 25.0) {
          scored.push({
            score: s,
            title: p.title,
            hierarchy: p._hierarchy || buildHierarchyString(p),
            subtitle: p.subtitle || (p.city ? `${p.city}، ${p.neighborhood || ''}` : p.address),
            address: p._hierarchy || p.address || p.title,
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

  // Debounced search engine effect
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
    const withDigits = convertQueryWordsToDigits(trimmed);
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

        // Coordinates biased strictly to Qazvin center
        const currentCoords = coordsRef.current;
        const biasLat = currentCoords?.lat || 36.2797;
        const biasLng = currentCoords?.lng || 50.0049;

        // Parse numbers if present in query (e.g. "حکمت چهل" -> 40, "حکمت سی" -> 30, "اندیشه ۱۲" -> 12)
        const queryNum = parsePersianWordNumber(trimmed) || parsePersianWordNumber(withDigits);
        const strippedPrefix = normalizedQ.replace(/^(کوچه|کوچه‌ی|بن\s*بست|بن‌بست|خیابان|بلوار)\s+/, '').trim();
        const strippedWithDigits = withDigits.replace(/^(کوچه|کوچه‌ی|بن\s*بست|بن‌بست|خیابان|بلوار)\s+/, '').trim();

        // Extract pure alley query without neighborhood (e.g. "نوروزیان حکمت سی" -> "حکمت سی" / "حکمت 30")
        let alleyQuery = strippedPrefix;
        let alleyQueryWithDigits = strippedWithDigits;
        for (const kn of KNOWN_NEIGHBORHOODS) {
          if (normalizedQ.includes(kn)) {
            const s1 = alleyQuery.replace(kn, '').trim();
            if (s1.length >= 2) alleyQuery = s1;
            const s2 = alleyQueryWithDigits.replace(kn, '').trim();
            if (s2.length >= 2) alleyQueryWithDigits = s2;
          }
        }

        // Generate smart search variants for remote geocoder
        const rawVariants = new Set();
        if (strippedPrefix) rawVariants.add(strippedPrefix);
        if (strippedWithDigits) rawVariants.add(strippedWithDigits);
        if (alleyQuery) rawVariants.add(alleyQuery);
        if (alleyQueryWithDigits) rawVariants.add(alleyQueryWithDigits);
        rawVariants.add(normalizedQ);
        if (withDigits) rawVariants.add(withDigits);

        // Stem expansions
        for (const t of tokens) {
          if (STEM_EXPANSIONS[t]) {
            for (const exp of STEM_EXPANSIONS[t]) {
              rawVariants.add(normalizedQ.replace(t, exp));
            }
          }
        }

        // Prepend Qazvin to variants to ensure strict Qazvin locality
        const finalVariants = [];
        for (const v of rawVariants) {
          if (!v.includes('قزوین')) {
            finalVariants.push(`قزوین ${v}`);
          }
          finalVariants.push(v);
        }

        const uniqueVariants = Array.from(new Set(finalVariants)).slice(0, 5);

        // Fetch Photon with Qazvin proximity bias
        const photonPromises = uniqueVariants.map((v) => {
          const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(v)}&lat=${biasLat}&lon=${biasLng}&lang=default&limit=10`;
          return fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          }).then((r) => (r.ok ? r.json() : { features: [] })).catch(() => ({ features: [] }));
        });

        const responses = await Promise.all(photonPromises);
        const allFeatures = [];
        const seenCoords = new Set();

        for (const data of responses) {
          if (Array.isArray(data.features)) {
            for (const f of data.features) {
              const coords = f.geometry?.coordinates || [];
              if (coords.length < 2) continue;
              const key = `${coords[1].toFixed(5)},${coords[0].toFixed(5)}`;
              if (!seenCoords.has(key)) {
                seenCoords.add(key);
                allFeatures.push(f);
              }
            }
          }
        }

        // Format and score remote items strictly into: شهر، محله، خیابان/بلوار، کوچه
        const osmItems = allFeatures
          .map((f) => {
            const props = f.properties || {};
            const geomCoords = f.geometry?.coordinates || [];
            const lat = geomCoords[1];
            const lng = geomCoords[0];

            // Distance from Qazvin center
            const distKm = Math.hypot((lat - 36.2797) * 111.0, (lng - 50.0049) * 88.0);
            if (distKm > 35) return null; // Reject items outside Qazvin area

            const osmVal = props.osm_value || props.type || '';
            const isAlley = ['residential', 'service', 'living_street', 'pedestrian'].includes(osmVal);

            let score = 100 - distKm * 2;
            if (isAlley) score += 100;

            const name = props.name || props.street || '';
            const normName = normalizePersian(name);
            const normNameWithDigits = convertQueryWordsToDigits(normName);
            const nameNum = parsePersianWordNumber(normName) || parsePersianWordNumber(normNameWithDigits);

            // EXACT MATCH CHECKS (Massive +650 boost)
            const isExactName = (normName === strippedPrefix || normName === normalizedQ || normName === alleyQuery);
            const isExactDigits = (normNameWithDigits === strippedWithDigits || normNameWithDigits === withDigits || normNameWithDigits === alleyQueryWithDigits);

            if (isExactName || isExactDigits) {
              score += 650;
            } else if (normName.startsWith(alleyQuery) && !normName.includes(' و ')) {
              score += 200;
            } else if (normName.includes(alleyQuery)) {
              score += 40;
            }

            // Conflict penalty: If user asked for specific number (e.g. 30 in حکمت سی),
            // and candidate has a different number (e.g. 31 or 38), penalize heavily
            if (queryNum !== null && nameNum !== null && queryNum !== nameNum) {
              score -= 250;
            }

            // Multi-token neighborhood match:
            // e.g. user typed "نوروزیان حکمت سی" -> candidate has locality "نوروزیان" or "دانشگاه"
            const fullCand = `${props.locality || ''} ${props.district || ''} ${props.street || ''} ${props.name || ''}`;
            for (const kn of KNOWN_NEIGHBORHOODS) {
              if (normalizedQ.includes(kn) && fullCand.includes(kn)) {
                score += 150;
              }
            }

            if (props.locality && KNOWN_NEIGHBORHOODS.includes(props.locality)) {
              score += 30;
            }

            const hierarchy = buildHierarchyString({ ...props, lat, lng });

            return {
              title: name,
              hierarchy,
              subtitle: props.street && props.name && props.street !== props.name ? `خیابان ${props.street}` : '',
              address: hierarchy,
              lat,
              lng,
              type: osmVal || 'place',
              source: 'osm',
              score,
            };
          })
          .filter(Boolean);

        // Sort OSM items by relevance
        osmItems.sort((a, b) => b.score - a.score);

        // Merge local matches and OSM results, deduplicating by hierarchy or proximity
        const combined = [...localMatches];
        for (const o of osmItems) {
          const isDuplicate = combined.some((existing) => {
            const dist = Math.hypot(existing.lat - o.lat, existing.lng - o.lng);
            return (
              dist < 0.002 ||
              existing.hierarchy === o.hierarchy
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

      const formattedHierarchy = item.hierarchy || item.address || item.title || '';

      onSelect?.({
        lat: Number(lat),
        lng: Number(lng),
        address: formattedHierarchy,
        title: formattedHierarchy,
      });

      // User requested: Do NOT change query in the search input on click!
      // Keep what they typed, close popover, and move map to location.
      skipNextSearch.current = true;
      setIsOpen(false);
      setActiveIndex(-1);
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
                  پیشنهاد معابر و کوچه‌ها (شهر، محله، خیابان، کوچه)
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
                  max-h-[220px] sm:max-h-[260px]
                  divide-y divide-slate-100 dark:divide-slate-800/60
                "
              >
                {results.map((item, index) => {
                  const displayText = item.hierarchy || item.title;
                  const secondaryText = item.subtitle && item.subtitle !== displayText ? item.subtitle : '';
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
                          {displayText}
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
                  {searchError ? 'خطا در جستجوی آدرس' : 'موردی در قزوین پیدا نشد'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  {searchError
                    ? 'لطفاً دوباره تلاش کنید یا موقعیت را روی نقشه انتخاب فرمایید.'
                    : 'نام محله، بلوار یا کوچه دیگری در قزوین را جستجو کنید.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
