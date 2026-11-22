import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { SearchBar } from './SearchBar';
import { SearchSuggestions } from './SearchSuggestions';
import { LOCAL_PLACES } from './iranPlaces';

const RECENT_SEARCHES_STORAGE_KEY = 'iranswim_qazvin_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export default function SearchLocation({
  onSelect,
  coords,
  onOpenChange,
  placeholder = 'جستجوی آدرس در قزوین (شهر، محله، خیابان، کوچه...)',
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

  // Offline / Fallback Local Search strictly using verified Qazvin places
  const searchLocalFallback = useCallback((q) => {
    const cleanQ = q.trim().toLowerCase();
    if (!cleanQ || !LOCAL_PLACES) return [];

    const matches = [];
    for (const p of LOCAL_PLACES) {
      const full = `${p.title || ''} ${p.address || ''} ${p.neighborhood || ''} ${p.street || ''} ${p.alley || ''}`.toLowerCase();
      if (full.includes(cleanQ)) {
        matches.push({
          id: `local_${p.lat}_${p.lng}`,
          title: p.title,
          subtitle: p.address,
          category: p.category || 'landmark',
          category_label: p.category === 'pool' ? 'استخر و اماکن ورزشی' : 'اماکن قزوین',
          neighborhood: p.neighborhood,
          latitude: p.lat,
          longitude: p.lng,
          icon: p.category === 'pool' ? 'Waves' : 'MapPin',
          type: p.type,
        });
      }
      if (matches.length >= 8) break;
    }
    return matches;
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
