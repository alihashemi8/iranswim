/**
 * Utility to normalize media file URLs.
 * Ensures URLs are served relatively (/media/... or /api/...) so they work seamlessly
 * across Vite dev server (port 5173), Docker Nginx (port 8080), and production domains.
 */
export const getMediaUrl = (url) => {
  if (!url) return null;
  if (typeof url !== 'string') return null;

  // Blob and data URLs should be returned as-is
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // If the URL contains /media/, extract the relative path starting from /media/
  // This handles URLs formatted like http://127.0.0.1:8080/media/... or http://localhost/media/...
  const mediaIndex = url.indexOf('/media/');
  if (mediaIndex !== -1) {
    return url.substring(mediaIndex);
  }

  // If the URL contains /api/, extract the relative path starting from /api/
  // This handles URLs formatted like http://localhost/api/swimmers/...
  const apiIndex = url.indexOf('/api/');
  if (apiIndex !== -1) {
    return url.substring(apiIndex);
  }

  return url;
};

/**
 * Normalizes document URLs and attaches JWT access token for authentication
 * when loading in standard <img> tags or opening in a new tab.
 */
export const getAuthenticatedDocUrl = (url) => {
  if (!url) return null;
  const normalized = getMediaUrl(url);
  if (!normalized) return null;

  // Blob and data URLs do not need auth tokens
  if (normalized.startsWith('blob:') || normalized.startsWith('data:')) {
    return normalized;
  }

  // If it's a secure document endpoint (/api/swimmers/.../documents/...), attach the token
  if (normalized.includes('/documents/') || normalized.startsWith('/api/')) {
    const token = localStorage.getItem('access_token');
    if (token && !normalized.includes('token=')) {
      const sep = normalized.includes('?') ? '&' : '?';
      return `${normalized}${sep}token=${encodeURIComponent(token)}`;
    }
  }

  return normalized;
};

