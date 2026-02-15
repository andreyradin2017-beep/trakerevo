/**
 * Checks if a URL is a TMDB image and proxies it if we are in production
 */
export const getProxiedImageUrl = (
  url: string | undefined,
): string | undefined => {
  if (!url) return url;

  const isProd = import.meta.env.PROD;
  const tmdbHost = "image.tmdb.org/t/p";

  if (isProd && url.includes(tmdbHost)) {
    try {
      const path = url.split(tmdbHost)[1];
      if (path) {
        return `/api/tmdb-image?path=${encodeURIComponent(path)}`;
      }
    } catch (e) {
      console.error("Error proxying TMDB image:", e);
    }
  }

  return url;
};
