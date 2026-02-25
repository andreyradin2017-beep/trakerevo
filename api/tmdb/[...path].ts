import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // The catch-all path segments from /api/tmdb/[...path]
  // e.g. for /api/tmdb/tv/123/season/1 -> path = ["tv", "123", "season", "1"]
  const pathSegments = req.query.path;
  const apiPath = Array.isArray(pathSegments)
    ? "/" + pathSegments.join("/")
    : typeof pathSegments === "string"
    ? "/" + pathSegments
    : "/";

  // Build params without the 'path' key
  const { path: _path, ...otherParams } = req.query;

  const tmdbUrl = new URL(`https://api.themoviedb.org/3${apiPath}`);

  // Forward all other query params (api_key, language, etc.)
  Object.entries(otherParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      tmdbUrl.searchParams.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => tmdbUrl.searchParams.append(key, v));
    }
  });

  try {
    const response = await fetch(tmdbUrl.toString(), {
      method: req.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = await response.json();

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Cache successful responses for 5min; stale-while-revalidate for 10min
    if (response.status === 200) {
      res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    }

    return res.status(response.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
