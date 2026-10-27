import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';

const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-map-pin-container',
    html: `
      <div style="position: relative; width: 38px; height: 38px; transform: translate(-50%, -100%);">
        <div style="
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 6px 16px rgba(2, 132, 199, 0.45);
          border: 3px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 12px; height: 12px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 5px;
          background: rgba(0,0,0,0.25);
          border-radius: 50%;
          filter: blur(1.5px);
        "></div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
};

export const MapLocationPicker = ({
  latitude,
  longitude,
  onChange,
  readOnly = false,
  height = '320px',
  label = 'مشخص کردن موقعیت منزل روی نقشه'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Default coordinate: Tehran center if none selected
  const defaultLat = 35.6892;
  const defaultLng = 51.3890;
  const currentLat = latitude ? Number(latitude) : null;
  const currentLng = longitude ? Number(longitude) : null;

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = currentLat || defaultLat;
    const initialLng = currentLng || defaultLng;
    const initialZoom = currentLat ? 15 : 12;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // If coordinates exist, create marker
    if (currentLat && currentLng) {
      const pinIcon = createCustomPinIcon();
      const marker = L.marker([currentLat, currentLng], {
        icon: pinIcon,
        draggable: !readOnly,
      }).addTo(map);

      marker.bindPopup('موقعیت منزل شناگر').openPopup();

      if (!readOnly && onChange) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChange({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
        });
      }

      markerRef.current = marker;
    }

    // Handle clicks on map if not readOnly
    if (!readOnly && onChange) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const fixedLat = Number(lat.toFixed(6));
        const fixedLng = Number(lng.toFixed(6));

        if (!markerRef.current) {
          const pinIcon = createCustomPinIcon();
          const marker = L.marker([fixedLat, fixedLng], {
            icon: pinIcon,
            draggable: true,
          }).addTo(map);

          marker.bindPopup('موقعیت انتخاب‌شده منزل').openPopup();

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
          });

          markerRef.current = marker;
        } else {
          markerRef.current.setLatLng([fixedLat, fixedLng]);
          markerRef.current.openPopup();
        }

        onChange({ lat: fixedLat, lng: fixedLng });
      });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync external changes in lat/lng with the marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (currentLat && currentLng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([currentLat, currentLng]);
      } else {
        const pinIcon = createCustomPinIcon();
        const marker = L.marker([currentLat, currentLng], {
          icon: pinIcon,
          draggable: !readOnly,
        }).addTo(mapInstanceRef.current);

        if (!readOnly && onChange) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
          });
        }
        markerRef.current = marker;
      }
    }
  }, [currentLat, currentLng, readOnly, onChange]);

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

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          markerRef.current.openPopup();
        } else if (mapInstanceRef.current) {
          const pinIcon = createCustomPinIcon();
          const marker = L.marker([lat, lng], {
            icon: pinIcon,
            draggable: !readOnly,
          }).addTo(mapInstanceRef.current);

          if (!readOnly && onChange) {
            marker.on('dragend', () => {
              const pos = marker.getLatLng();
              onChange({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
            });
          }
          markerRef.current = marker;
        }

        if (onChange) {
          onChange({ lat, lng });
        }
      },
      (err) => {
        setGeoLocating(false);
        setGeoError('امکان دریافت موقعیت مکانی از دستگاه میسر نشد (دسترسی به GPS را فعال فرمایید).');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{label}</span>
          {!readOnly && <span className="text-rose-500 font-bold">*</span>}
        </label>

        {!readOnly && (
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={geoLocating}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-lg border border-sky-200/60 dark:border-sky-800 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Navigation className={`w-3 h-3 ${geoLocating ? 'animate-spin' : ''}`} />
            <span>{geoLocating ? 'در حال دریافت موقعیت...' : 'موقعیت فعلی من (GPS)'}</span>
          </button>
        )}
      </div>

      <div
        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner z-0"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />

        {!readOnly && (
          <div className="absolute top-2.5 right-2.5 z-[500] pointer-events-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
            <Compass className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span>برای تعیین آدرس، روی نقشه کلیک کنید یا نشانگر را جابجا نمایید</span>
          </div>
        )}
      </div>

      {geoError && (
        <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

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
