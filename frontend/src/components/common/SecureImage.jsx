import React, { useState, useEffect } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { getAuthenticatedDocUrl, getMediaUrl } from '../../utils/media';

/**
 * SecureImage component that handles authenticated document/media loading.
 * Automatically adds auth tokens for protected endpoints and renders a loading skeleton
 * while the image is loading, with a friendly fallback if it fails.
 */
export const SecureImage = ({
  src,
  alt = '',
  className = 'w-full h-full object-cover',
  fallbackText = 'بارگذاری نشده',
  fallbackClassName = 'h-full w-full flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50',
  onClick,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const authUrl = getAuthenticatedDocUrl(src);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  if (!src) {
    return (
      <div className={fallbackClassName}>
        <ImageOff className="w-6 h-6 mb-1 opacity-50" />
        <span>{fallbackText}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {loading && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center z-10">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      )}

      {error ? (
        <div className={fallbackClassName}>
          <ImageOff className="w-6 h-6 mb-1 text-rose-400" />
          <span className="text-rose-500 font-medium">خطا در دریافت تصویر</span>
        </div>
      ) : (
        <img
          src={authUrl}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
};
