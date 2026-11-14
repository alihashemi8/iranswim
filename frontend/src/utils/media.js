/**
 * Utility to normalize media file URLs.
 * Ensures URLs are served relatively (/media/...) so they work seamlessly
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
  // This handles URLs formatted like http://127.0.0.1:8080/media/... or http://backend:8000/media/...
  const mediaIndex = url.indexOf('/media/');
  if (mediaIndex !== -1) {
    return url.substring(mediaIndex);
  }

  return url;
};
