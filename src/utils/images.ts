export const getProxiedImageUrl = (
  url: string | undefined,
): string | undefined => {
  if (!url) return url;

  // Avoid double proxying if the URL is already using wsrv.nl
  if (url.includes("wsrv.nl")) {
    return url;
  }

  // Handle old /tmdb-image proxy URLs (convert to direct TMDB URL)
  if (url.startsWith("/tmdb-image/")) {
    url = url.replace("/tmdb-image", "https://image.tmdb.org/t/p");
  }

  // Use wsrv.nl to proxy images (bypasses TMDB blocks in RU and handles CORS)
  if (url.includes("image.tmdb.org")) {
    // Always use wsrv.nl for simplicity and to avoid CORS issues
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }

  return url;
};
