export const getProxiedImageUrl = (
  url: string | undefined,
): string | undefined => {
  if (!url) return url;

  // Avoid double proxying if the URL is already using wsrv.nl
  if (url.includes("wsrv.nl")) {
    return url;
  }

  // Use wsrv.nl to proxy images (bypasses TMDB blocks in RU and handles CORS)
  // This works both locally and in production without needing our own API route
  if (url.includes("image.tmdb.org")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }

  return url;
};
