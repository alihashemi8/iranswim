import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, LocateFixed, Compass, AlertCircle, Loader2 } from 'lucide-react';
import SearchLocation from './SearchLocation';

const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-map-pin-container',
    html: `
      <div style="position: relative; width: 36px; height: 36px;">
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45);
          border: 2.5px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 11px; height: 11px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
        <div style="
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 5px;
          background: rgba(0,0,0,0.3);
          border-radius: 50%;
          filter: blur(1.5px);
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

export const MapLocationPicker = ({
  latitude,
  longitude,
  onChange,
  readOnly = false,
  height = '360px',
  label = 'مشخص کردن موقعیت منزل روی نقشه',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const onChangeRef = useRef(onChange);
  const readOnlyRef = useRef(readOnly);

  useEffect(() => {
    onChangeRef.current = onChange;
    readOnlyRef.current = readOnly;
  }, [onChange, readOnly]);

  // Default coordinate: Qazvin city center if none selected
  const defaultLat = 36.2797;
  const defaultLng = 50.0049;
  const currentLat = latitude ? Number(latitude) : null;
  const currentLng = longitude ? Number(longitude) : null;

  // Helper to ensure a marker exists or update its position
  const placeOrUpdateMarker = useCallback(
    (lat, lng, popupText = 'موقعیت انتخاب‌شده منزل') => {
      if (!mapInstanceRef.current) return;
      const map = mapInstanceRef.current;
      const isReadOnly = readOnlyRef.current;

      if (!markerRef.current) {
        const pinIcon = createCustomPinIcon();
        const marker = L.marker([lat, lng], {
          icon: pinIcon,
          draggable: !isReadOnly,
        }).addTo(map);

        if (popupText) {
          marker.bindPopup(popupText).openPopup();
        }

        if (!isReadOnly) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const fixedLat = Number(pos.lat.toFixed(6));
            const fixedLng = Number(pos.lng.toFixed(6));
            onChangeRef.current?.({ lat: fixedLat, lng: fixedLng });
          });
        }

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([lat, lng]);
        if (popupText) {
          markerRef.current.setPopupContent(popupText).openPopup();
        }
      }
    },
    []
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = currentLat || defaultLat;
    const initialLng = currentLng || defaultLng;
    const initialZoom = currentLat && currentLng ? 15 : 13.5;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false, // We customize zoomControl to bottomright so it never clashes with top search bar
      attributionControl: false,
    });

    // Add zoom controls at bottomright
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Place initial marker if coordinates are provided
    if (currentLat && currentLng) {
      placeOrUpdateMarker(
        currentLat,
        currentLng,
        readOnlyRef.current ? 'موقعیت منزل شناگر' : 'موقعیت انتخاب‌شده منزل'
      );
    }

    // Map click handler to place/move marker
    map.on('click', (e) => {
      if (readOnlyRef.current) return;
      const { lat, lng } = e.latlng;
      const fixedLat = Number(lat.toFixed(6));
      const fixedLng = Number(lng.toFixed(6));

      placeOrUpdateMarker(fixedLat, fixedLng, 'موقعیت انتخاب‌شده منزل');
      onChangeRef.current?.({ lat: fixedLat, lng: fixedLng });
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync external changes in lat/lng with the marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (currentLat && currentLng) {
      const curMarker = markerRef.current;
      if (curMarker) {
        const pos = curMarker.getLatLng();
        if (
          Math.abs(pos.lat - currentLat) > 0.0001 ||
          Math.abs(pos.lng - currentLng) > 0.0001
        ) {
          curMarker.setLatLng([currentLat, currentLng]);
        }
      } else {
        placeOrUpdateMarker(
          currentLat,
          currentLng,
          readOnly ? 'موقعیت منزل شناگر' : 'موقعیت انتخاب‌شده منزل'
        );
      }
    }
  }, [currentLat, currentLng, readOnly, placeOrUpdateMarker]);

  // Handle GPS Live Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('مرورگر شما از قابلیت موقعیت‌یابی پشتیبانی نمی‌کند.');
      return;
    }

    setGeoLocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLocating(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
        }

        placeOrUpdateMarker(lat, lng, 'موقعیت فعلی من (GPS)');

        if (onChange) {
          onChange({ lat, lng });
        }
      },
      () => {
        setGeoLocating(false);
        setGeoError('امکان دریافت موقعیت مکانی از دستگاه میسر نشد (دسترسی به GPS را فعال فرمایید).');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle selection from search autocomplete
  const handleSearchSelect = ({ lat, lng, address, title }) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
    }

    const popupText = title || address || 'موقعیت انتخاب‌شده';
    placeOrUpdateMarker(lat, lng, popupText);

    if (onChange) {
      onChange({ lat, lng, address, title });
    }
  };

  return (
    <div className="space-y-2">
      {/* Label Row */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{label}</span>
          {!readOnly && <span className="text-rose-500 font-bold">*</span>}
        </label>
      </div>

      {/* MAP CONTAINER */}
      <div
        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner z-0"
        style={{ height }}
      >
        {/* LEAFLET MAP VIEW */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* 1. FLOATING SEARCH BAR (Inside the Map at Top) */}
        {!readOnly && (
          <div className="absolute top-3 inset-x-3 z-[1000] pointer-events-auto">
            <SearchLocation
              coords={currentLat && currentLng ? { lat: currentLat, lng: currentLng } : null}
              onSelect={handleSearchSelect}
              onOpenChange={setIsSearchOpen}
              placeholder="جستجوی آدرس در قزوین (شهر، محله، خیابان، کوچه...)"
            />
          </div>
        )}

        {/* 2. FLOATING LIVE LOCATION (GPS) BUTTON (Icon Only) */}
        {!readOnly && (
          <div
            className={`
              absolute bottom-3 left-3 z-[1000] pointer-events-auto
              transition-all duration-300
              ${isSearchOpen ? 'opacity-30 sm:opacity-100' : 'opacity-100'}
            `}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={geoLocating}
              title={geoLocating ? 'در حال دریافت موقعیت...' : 'موقعیت فعلی من (GPS)'}
              aria-label="موقعیت فعلی من (GPS)"
              className="
                group flex items-center justify-center
                w-11 h-11
                rounded-full
                bg-white/98 dark:bg-slate-900/98
                backdrop-blur-md
                border border-sky-200/90 dark:border-slate-700/90
                shadow-xl shadow-slate-900/15 dark:shadow-black/50
                text-sky-600 dark:text-sky-400
                hover:bg-sky-50 dark:hover:bg-slate-800
                hover:border-sky-400 dark:hover:border-sky-500
                hover:scale-105
                active:scale-95
                transition-all duration-200
                cursor-pointer
                disabled:opacity-60 disabled:pointer-events-none
              "
            >
              {geoLocating ? (
                <Loader2 className="w-5 h-5 animate-spin text-sky-600 dark:text-sky-400" />
              ) : (
                <LocateFixed className="w-5 h-5 text-sky-600 dark:text-sky-400 transition-transform group-hover:scale-110" />
              )}
            </button>
          </div>
        )}

        {/* 3. HELPER HINT ON MAP (When not readOnly and no location selected yet) */}
        {!readOnly && !currentLat && !currentLng && !isSearchOpen && (
          <div className="hidden sm:flex absolute bottom-3 right-14 z-[900] pointer-events-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-[11px] text-slate-600 dark:text-slate-300 items-center gap-1.5 font-medium">
            <Compass className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span>برای تعیین موقعیت، روی نقشه کلیک کنید یا نشانگر را جابجا نمایید</span>
          </div>
        )}
      </div>

      {/* GPS Error Alert */}
      {geoError && (
        <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Coordinates Status Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
        <span>مختصات ثبت‌شده:</span>
        {currentLat && currentLng ? (
          <span className="text-sky-700 dark:text-sky-400 font-bold">
            عرض: {currentLat.toFixed(5)} | طول: {currentLng.toFixed(5)}
          </span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400 font-sans">
            هنوز موقعیتی انتخاب نشده است (الزامی)
          </span>
        )}
      </div>
    </div>
  );
};

export default MapLocationPicker;
